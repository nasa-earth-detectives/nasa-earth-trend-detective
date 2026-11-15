"""Lightens the satellite models already prepared for the web scene.

Rationale: on screen each satellite is about 60 pixels wide, but the four models add up to 156,000
triangles in 88 draw calls. Measured in a browser rendering by software (1366x768, half resolution),
they cost 14 ms of a 59 ms frame: a quarter of the frame for four small objects, and it is geometry,
so lowering the resolution does not help. Fewer triangles and fewer draw calls cost less on every
machine, and the download shrinks too.

What it does to each model:
- merges materials that look the same (same colour, metalness, roughness, emission and texture), so
  their meshes can be drawn in one call;
- joins all meshes into one object, which the exporter splits by material;
- collapses edges down to a triangle budget. On the joined mesh the collapse spends its budget where
  the model is dense and leaves the large flat panels alone (decimating each mesh by the same ratio
  is what broke Terra's solar array into bands in prepare_nasa_satellites.py).

The script renders nothing (mesh processing only), requiring no GPU.

Usage:
    blender -b --factory-startup --python scripts/satellites/reduce_satellite_models.py -- \
        <folder with terra.glb aqua.glb oco2.glb grace.glb> <output folder> [triangle budget per model]
"""
import os
import sys

import bpy

MODELOS = ('terra', 'aqua', 'oco2', 'grace')


def firma(material):
    """What makes two materials look the same: the inputs of the shader and the images it reads."""
    if not material.use_nodes:
        return ('sin nodos', material.name)
    partes = []
    for nodo in material.node_tree.nodes:
        if nodo.type == 'TEX_IMAGE':
            partes.append(('imagen', nodo.image.name if nodo.image else None))
        if nodo.type != 'BSDF_PRINCIPLED':
            continue
        for entrada in nodo.inputs:
            # A linked input takes its value from another node (a texture): the image above covers it.
            if entrada.is_linked or not hasattr(entrada, 'default_value'):
                partes.append((entrada.name, 'enlazada' if entrada.is_linked else None))
                continue
            valor = entrada.default_value
            try:
                valor = tuple(round(float(v), 4) for v in valor)
            except TypeError:
                valor = round(float(valor), 4)
            partes.append((entrada.name, valor))
    return (material.blend_method, material.use_backface_culling, tuple(sorted(partes, key=str)))


def triangulos(objeto):
    objeto.data.calc_loop_triangles()
    return len(objeto.data.loop_triangles)


def reducir(nombre, origen, destino, presupuesto):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=origen)
    mallas = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    antes = sum(triangulos(o) for o in mallas)
    materiales_antes = len({s.material for o in mallas for s in o.material_slots if s.material})

    # One material per look: the first one found stands for all its equals.
    representante = {}
    for objeto in mallas:
        for ranura in objeto.material_slots:
            if ranura.material:
                ranura.material = representante.setdefault(firma(ranura.material), ranura.material)

    # The glTF importer leaves meshes under empties with their own transforms: bake them in first,
    # or joining would move the parts.
    for objeto in mallas:
        mundo = objeto.matrix_world.copy()
        objeto.parent = None
        objeto.matrix_world = mundo
        if objeto.data.users > 1:
            objeto.data = objeto.data.copy()
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for objeto in mallas:
        objeto.select_set(True)
    bpy.context.view_layer.objects.active = mallas[0]
    if len(mallas) > 1:
        bpy.ops.object.join()
    unido = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    total = triangulos(unido)
    if total > presupuesto:
        modificador = unido.modifiers.new('reducir', 'DECIMATE')
        modificador.ratio = presupuesto / total
        bpy.ops.object.modifier_apply(modifier=modificador.name)
    bpy.ops.object.material_slot_remove_unused()

    for objeto in [o for o in bpy.context.scene.objects if o.type != 'MESH']:
        bpy.data.objects.remove(objeto, do_unlink=True)
    # Same export settings as prepare_nasa_satellites.py, so the web loader needs no change.
    bpy.ops.export_scene.gltf(
        filepath=destino, export_format='GLB', export_apply=True, export_yup=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12, export_image_format='JPEG')
    despues = triangulos(unido)
    materiales = len([s for s in unido.material_slots if s.material])
    print(f'{nombre}: {antes} -> {despues} triangles, {len(mallas)} meshes -> 1, '
          f'{materiales_antes} -> {materiales} materials, '
          f'{os.path.getsize(origen) / 1024:.0f} -> {os.path.getsize(destino) / 1024:.0f} KB')


def principal():
    argumentos = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if len(argumentos) < 2:
        raise SystemExit(__doc__)
    entrada, salida = argumentos[0], argumentos[1]
    presupuesto = int(argumentos[2]) if len(argumentos) > 2 else 12000
    os.makedirs(salida, exist_ok=True)
    for nombre in MODELOS:
        reducir(nombre, os.path.join(entrada, f'{nombre}.glb'), os.path.join(salida, f'{nombre}.glb'), presupuesto)


principal()
