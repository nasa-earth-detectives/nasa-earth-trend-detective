"""Preview prepared satellites (Cycles + OptiX on RTX 4060).

Rationale: verify orientation (wings along X, +Y up) and materials before viewing on the globe,
where they appear small and in motion. Aborts without an OptiX GPU: CPU rendering is 20x slower.

Usage:
    blender -b --factory-startup --python scripts/satellites/preview_satellites.py -- \
        frontend/public/models/satellites <output-folder>
"""
import math
import os
import sys

import bpy
from mathutils import Vector


def activar_optix() -> None:
    preferencias = bpy.context.preferences.addons['cycles'].preferences
    preferencias.compute_device_type = 'OPTIX'
    preferencias.get_devices()
    gpus = [d for d in preferencias.devices if d.type == 'OPTIX']
    if not gpus:
        raise SystemExit('No OptiX GPU found: aborting instead of CPU rendering.')
    for dispositivo in preferencias.devices:
        dispositivo.use = dispositivo.type == 'OPTIX'
    escena = bpy.context.scene
    escena.render.engine = 'CYCLES'
    escena.cycles.device = 'GPU'
    print('GPU:', ', '.join(d.name for d in gpus))


def preparar_escena() -> None:
    escena = bpy.context.scene
    escena.cycles.samples = 48
    escena.cycles.use_denoising = True
    escena.render.resolution_x, escena.render.resolution_y = 960, 540
    escena.render.film_transparent = False
    mundo = bpy.data.worlds.new('espacio')
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes['Background']
    fondo.inputs['Color'].default_value = (0.02, 0.025, 0.04, 1)
    fondo.inputs['Strength'].default_value = 1.0
    escena.world = mundo
    # Harsh sunlight as in orbit, plus faint bluish fill (Earthlight).
    sol = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN'))
    sol.data.energy = 5
    sol.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
    relleno = bpy.data.objects.new('tierra', bpy.data.lights.new('tierra', 'SUN'))
    relleno.data.energy = 0.8
    relleno.data.color = (0.5, 0.65, 1.0)
    relleno.rotation_euler = (math.radians(200), 0, 0)
    escena.collection.objects.link(sol)
    escena.collection.objects.link(relleno)
    camara = bpy.data.objects.new('camara', bpy.data.cameras.new('camara'))
    camara.location = Vector((1.15, -1.25, 0.7))
    direccion = Vector((0, 0, 0)) - camara.location
    camara.rotation_euler = direccion.to_track_quat('-Z', 'Y').to_euler()
    escena.collection.objects.link(camara)
    escena.camera = camara


def main() -> None:
    entrada, salida = sys.argv[sys.argv.index('--') + 1:][:2]
    os.makedirs(salida, exist_ok=True)
    for archivo in sorted(os.listdir(entrada)):
        if not archivo.endswith('.glb'):
            continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        activar_optix()
        preparar_escena()
        bpy.ops.import_scene.gltf(filepath=os.path.join(entrada, archivo))
        bpy.context.scene.render.filepath = os.path.join(salida, archivo.replace('.glb', '.png'))
        bpy.ops.render.render(write_still=True)
        print('rendered', bpy.context.scene.render.filepath)


if __name__ == '__main__':
    main()
