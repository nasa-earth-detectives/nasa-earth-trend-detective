"""Prepares official NASA 3D models (NASA-3D-Resources) for the web scene.

Rationale: original GLBs are faithful to each mission but unsuitable as-is for the globe.
- Each model has its own scale (Terra in millimeters) and orientation, with origins far from the body.
- Materials are flat (matte gold, plain blue panels) or broken: Terra lacks textures
  (solarpanels.tga is empty) and GRACE includes a placeholder pink texture.
- Aqua and Terra exceed 115,000 triangles each: too high for a scene detail element.

The script renders nothing (mesh processing only), requiring no GPU. Material rules
are in satellite_materials.py within the same folder.

Usage:
    blender -b --factory-startup --python scripts/satellites/prepare_nasa_satellites.py -- \
        data/nasa/raw/models frontend/public/models/satellites
"""
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

# Blender runs the script with --python without adding its directory to sys.path: without this
# it cannot find the sibling materials module.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from satellite_materials import aplicar_material, categoria, textura_celdas  # noqa: E402

# Rotation (degrees, Blender Z-axis) to align solar wings along +X. Exported glTF
# converts Blender Z-up to Y-up: in three.js the wings align with X.
MODELOS = {
    'terra': {'archivo': 'terra.glb', 'rot_z': 90},
    'aqua': {'archivo': 'aqua.glb', 'rot_z': -90},
    'oco2': {'archivo': 'oco2.glb', 'rot_z': 90},
    # GRACE flies along its long axis: left as-is (long axis = forward direction).
    'grace': {'archivo': 'grace.glb', 'rot_z': 0},
}
MAX_TRIANGULOS = 45000


def centro_del_cuerpo(mallas) -> Vector:
    """Center of faces that are not solar panels: origin stays on the body, not midway
    along the wing (Aqua has a single long wing and its bounding box falls far from the satellite)."""
    puntos = []
    for objeto in mallas:
        datos = objeto.data
        for poligono in datos.polygons:
            material = datos.materials[poligono.material_index] if datos.materials else None
            if material and categoria(material.name) in ('solar', 'solar_dorso'):
                continue
            for indice in poligono.vertices:
                puntos.append(objeto.matrix_world @ datos.vertices[indice].co)
    if not puntos:
        return Vector((0, 0, 0))
    arr = np.array([tuple(p) for p in puntos])
    return Vector(((arr.min(0) + arr.max(0)) / 2).tolist())


def preparar(nombre: str, origen: str, destino: str) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    celdas = textura_celdas()
    bpy.ops.import_scene.gltf(filepath=origen)
    mallas = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    con_celdas = set()
    for material in {s.material for o in mallas for s in o.material_slots if s.material}:
        cat = categoria(material.name)
        if cat and aplicar_material(material, cat, celdas):
            con_celdas.add(material.name)

    # Original GLBs have parent nodes with custom scales (Terra in mm under an empty). First,
    # unparent each mesh while preserving world transforms; otherwise removing empties leaves
    # child scales uncompensated (producing satellites larger than Earth).
    for objeto in mallas:
        mundo = objeto.matrix_world.copy()
        objeto.parent = None
        objeto.matrix_world = mundo
        if objeto.data.users > 1:
            objeto.data = objeto.data.copy()  # instances: do not transform the same mesh twice
    bpy.context.view_layer.update()

    # Vertex transformations: rotate wings to +X, center on body, unit scale.
    rot = Matrix.Rotation(math.radians(MODELOS[nombre]['rot_z']), 4, 'Z')
    for objeto in mallas:
        objeto.data.transform(rot @ objeto.matrix_world)
        objeto.matrix_world = Matrix.Identity(4)
    centro = centro_del_cuerpo(mallas)
    minimo = np.full(3, np.inf)
    maximo = np.full(3, -np.inf)
    for objeto in mallas:
        coords = np.array([tuple(v.co) for v in objeto.data.vertices])
        minimo = np.minimum(minimo, coords.min(0))
        maximo = np.maximum(maximo, coords.max(0))
    escala = 1.0 / float((maximo - minimo).max())
    ajuste = Matrix.Diagonal((escala, escala, escala, 1)) @ Matrix.Translation(-centro)
    for objeto in mallas:
        objeto.data.transform(ajuste)
        objeto.data.update()

    # Meshes with procedural cells: original lacks usable UVs (appeared plain blue). Cube
    # projection in unit space: ~12 tiles of 8x8 cells along a wing.
    for objeto in mallas:
        if any(s.material and s.material.name in con_celdas for s in objeto.material_slots):
            bpy.context.view_layer.objects.active = objeto
            for otro in mallas:
                otro.select_set(otro is objeto)
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.cube_project(cube_size=0.08)
            bpy.ops.object.mode_set(mode='OBJECT')

    triangulos = 0
    for objeto in mallas:
        objeto.data.calc_loop_triangles()
        triangulos += len(objeto.data.loop_triangles)
    if triangulos > MAX_TRIANGULOS:
        # Decimate only dense meshes: applied uniformly, Terra's solar panel (few large,
        # flat polygons) broke into banded gaps.
        pesadas = [o for o in mallas if len(o.data.loop_triangles) > 8000]
        ligeras = triangulos - sum(len(o.data.loop_triangles) for o in pesadas)
        total_pesadas = sum(len(o.data.loop_triangles) for o in pesadas)
        proporcion = max(0.2, (MAX_TRIANGULOS - ligeras) / max(total_pesadas, 1))
        for objeto in pesadas:
            modificador = objeto.modifiers.new('reducir', 'DECIMATE')
            modificador.ratio = min(1.0, proporcion)

    # Empty objects from the original hierarchy (with transforms) are no longer needed.
    for objeto in [o for o in bpy.context.scene.objects if o.type != 'MESH']:
        bpy.data.objects.remove(objeto, do_unlink=True)
    bpy.ops.export_scene.gltf(
        filepath=destino, export_format='GLB', export_apply=True, export_yup=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12, export_image_format='JPEG')
    final = 0
    for objeto in bpy.context.scene.objects:
        if objeto.type == 'MESH':
            evaluado = objeto.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
            evaluado.calc_loop_triangles()
            final += len(evaluado.loop_triangles)
    caja = np.full(3, np.inf), np.full(3, -np.inf)
    for objeto in bpy.context.scene.objects:
        if objeto.type == 'MESH':
            for esquina in objeto.bound_box:
                w = np.array(tuple(objeto.matrix_world @ Vector(esquina)))
                caja = np.minimum(caja[0], w), np.maximum(caja[1], w)
    print(f'{nombre}: final bounding box {np.round(caja[0], 3)} .. {np.round(caja[1], 3)}')
    print(f'{nombre}: {triangulos} -> {final} triangles, scale {escala:.6g}, '
          f'center {tuple(round(c, 2) for c in centro)}, {os.path.getsize(destino) / 1024:.0f} KB')


def main() -> None:
    argumentos = sys.argv[sys.argv.index('--') + 1:]
    entrada, salida = argumentos[0], argumentos[1]
    os.makedirs(salida, exist_ok=True)
    for nombre, info in MODELOS.items():
        preparar(nombre, os.path.join(entrada, info['archivo']), os.path.join(salida, f'{nombre}.glb'))


if __name__ == '__main__':
    main()
