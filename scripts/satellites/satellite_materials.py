"""Physically based materials for NASA models (used by prepare_nasa_satellites.py).

Rationale: original materials are flat or broken, and substitution rules
(which name maps to gold foil, which maps to solar cell) are the most frequently tweaked
when adding a new satellite. Separating them from mesh processing keeps them easy to inspect.
"""
import bpy
import numpy as np

# Physically based materials by category. Reference values from real aerospace materials:
# gold foil (MLI) is highly reflective metal, solar cells are glossy dark glass.
CATEGORIAS = {
    'oro': {'color': (1.0, 0.72, 0.30), 'metal': 1.0, 'rugosidad': 0.32},
    'bronce': {'color': (0.78, 0.55, 0.28), 'metal': 1.0, 'rugosidad': 0.38},
    'solar': {'color': (0.06, 0.09, 0.24), 'metal': 0.6, 'rugosidad': 0.2},
    'solar_dorso': {'color': (0.12, 0.12, 0.13), 'metal': 0.3, 'rugosidad': 0.6},
    'blanco': {'color': (0.88, 0.88, 0.86), 'metal': 0.0, 'rugosidad': 0.45},
    'plata': {'color': (0.82, 0.83, 0.86), 'metal': 1.0, 'rugosidad': 0.28},
    'metal': {'color': (0.55, 0.56, 0.58), 'metal': 0.9, 'rugosidad': 0.35},
    'negro': {'color': (0.04, 0.04, 0.045), 'metal': 0.2, 'rugosidad': 0.6},
}

# Order matters: first matching rule wins (e.g. "SolarPanelBack" before "solar").
REGLAS = [
    (('solarpanelback', 'solarbak'), 'solar_dorso'),
    (('solar', 'panelfaces'), 'solar'),
    (('bronze',), 'bronce'),
    (('foil', 'gold', 'antenna_base', 'antenna_dish_outer', 'antenna_poles', 'ends', 'edges',
      'topnbott', 'bottom disk', 'sidesborder'), 'oro'),
    (('underside', 'silver'), 'plata'),
    (('radiator', 'plating', 'light_metal', 'detail', 'gps', 'side_hole', 'dish_inner',
      'instdtl', 'whblock', 'main dish', 'side panels'), 'blanco'),
    (('thruster', 'blk', 'blblock', 'divider', 'hooded'), 'negro'),
    (('metal', 'crome', 'grey', 'gray', 'hardware', 'surfaces'), 'metal'),
]


def categoria(nombre: str) -> str | None:
    bajo = nombre.lower()
    # The "UV" texture on GRACE represents its solar cells (top face of prism).
    if bajo == 'uv':
        return 'solar'
    for claves, cat in REGLAS:
        if any(clave in bajo for clave in claves):
            return cat
    return None


def textura_celdas() -> bpy.types.Image:
    """Procedural photovoltaic cells: substitute for missing textures in original model."""
    lado, celdas = 256, 8
    pixeles = np.zeros((lado, lado, 4), dtype=np.float32)
    pixeles[..., :3] = (0.05, 0.08, 0.22)
    pixeles[..., 3] = 1.0
    paso = lado // celdas
    rng = np.random.default_rng(2026)
    for i in range(celdas):
        for j in range(celdas):
            tono = rng.uniform(-0.015, 0.015)
            pixeles[i * paso + 2:(i + 1) * paso - 2, j * paso + 2:(j + 1) * paso - 2, :3] = (
                0.07 + tono, 0.11 + tono, 0.30 + tono)
    pixeles[::paso, :, :3] = 0.55
    pixeles[:, ::paso, :3] = 0.55
    imagen = bpy.data.images.new('celdas_solares', lado, lado)
    imagen.pixels = pixeles.ravel()
    imagen.pack()
    return imagen


def aplicar_material(material: bpy.types.Material, cat: str, celdas: bpy.types.Image) -> bool:
    """Returns True if material uses procedural cells (mesh will require its own UVs)."""
    valores = CATEGORIAS[cat]
    material.use_nodes = True
    nodos = material.node_tree.nodes
    bsdf = next((n for n in nodos if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        return False
    # Opaque: some originals have transparency, allowing the body to show through the panel.
    material.surface_render_method = 'DITHERED'
    for enlace in list(bsdf.inputs['Alpha'].links):
        material.node_tree.links.remove(enlace)
    bsdf.inputs['Alpha'].default_value = 1.0
    usa_celdas = False
    entrada_color = bsdf.inputs['Base Color']
    textura = next((l.from_node for l in entrada_color.links if l.from_node.type == 'TEX_IMAGE'), None)
    textura_valida = textura is not None and textura.image is not None and textura.image.size[0] > 0
    if cat == 'solar' and not textura_valida:
        # No valid texture: procedural cells, mapped with whatever UVs the mesh provides.
        textura = nodos.new('ShaderNodeTexImage')
        textura.image = celdas
        material.node_tree.links.new(textura.outputs['Color'], entrada_color)
        textura_valida = True
        usa_celdas = True
    if not (cat == 'solar' and textura_valida):
        for enlace in list(entrada_color.links):
            material.node_tree.links.remove(enlace)
        entrada_color.default_value = (*valores['color'], 1.0)
    bsdf.inputs['Metallic'].default_value = valores['metal']
    bsdf.inputs['Roughness'].default_value = valores['rugosidad']
    return usa_celdas
