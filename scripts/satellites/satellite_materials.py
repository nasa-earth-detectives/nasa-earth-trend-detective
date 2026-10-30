"""Materiales físicos para los modelos de la NASA (lo usa prepare_nasa_satellites.py).

Por qué existe aparte: los materiales originales son planos o están rotos, y las reglas para
sustituirlos (qué nombre es lámina dorada, qué nombre es celda solar) son lo que más se toca al
añadir un satélite nuevo. Separadas del procesado de mallas se revisan sin leer lo demás.
"""
import bpy
import numpy as np

# Materiales físicos por categoría. Valores de referencia de materiales espaciales reales:
# la lámina dorada (MLI) es metal muy reflectante, las celdas solares son vidrio oscuro brillante.
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

# Orden importa: la primera regla que coincide gana (p. ej. "SolarPanelBack" antes que "solar").
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
    # La textura "UV" de GRACE son sus celdas solares (cara superior del prisma).
    if bajo == 'uv':
        return 'solar'
    for claves, cat in REGLAS:
        if any(clave in bajo for clave in claves):
            return cat
    return None


def textura_celdas() -> bpy.types.Image:
    """Celdas fotovoltaicas generadas: sustituyen a las texturas que faltan en el original."""
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
    """Devuelve True si el material usa las celdas generadas (la malla necesitará UV propias)."""
    valores = CATEGORIAS[cat]
    material.use_nodes = True
    nodos = material.node_tree.nodes
    bsdf = next((n for n in nodos if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        return False
    # Opaco: algunos originales traen transparencia y el panel dejaba ver el cuerpo detrás.
    material.surface_render_method = 'DITHERED'
    for enlace in list(bsdf.inputs['Alpha'].links):
        material.node_tree.links.remove(enlace)
    bsdf.inputs['Alpha'].default_value = 1.0
    usa_celdas = False
    entrada_color = bsdf.inputs['Base Color']
    textura = next((l.from_node for l in entrada_color.links if l.from_node.type == 'TEX_IMAGE'), None)
    textura_valida = textura is not None and textura.image is not None and textura.image.size[0] > 0
    if cat == 'solar' and not textura_valida:
        # Sin textura válida: celdas generadas, mapeadas con las UV que traiga la malla.
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
