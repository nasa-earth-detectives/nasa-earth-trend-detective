import { Group, Mesh, MeshStandardMaterial, type Material, type Texture } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Modelos oficiales de la NASA (NASA-3D-Resources) preparados con
 * scripts/satellites/prepare_nasa_satellites.py: alas solares sobre X, +Y arriba, origen en el
 * cuerpo, tamaño máximo 1 y materiales físicos (lámina dorada, celdas solares, aluminio).
 * Comprimidos con Draco (de 6,2 MB a 1,96 MB los cuatro).
 */
const base = import.meta.env.BASE_URL;

export function createSatelliteGltfLoader(envMap: Texture) {
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${base}draco/`);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const loaded: GLTF[] = [];
  let disposed = false;

  /** Carga el modelo y lo entrega listo para la escena; null si falla (queda el procedural). */
  const load = async (model: string, size: number): Promise<Group | null> => {
    try {
      const gltf = await loader.loadAsync(`${base}models/satellites/${model}.glb`);
      if (disposed) {
        disposeGltf(gltf);
        return null;
      }
      loaded.push(gltf);
      gltf.scene.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        child.raycast = () => {};
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          if (material instanceof MeshStandardMaterial) {
            // Reflejos tenues: el entorno es una habitación clara y a intensidad 1 el oro salía
            // casi blanco. En el espacio el fondo es negro y el oro brilla donde le da el sol.
            material.envMap = envMap;
            material.envMapIntensity = 0.35;
            material.needsUpdate = true;
          }
        }
      });
      const holder = new Group();
      gltf.scene.scale.setScalar(size);
      holder.add(gltf.scene);
      return holder;
    } catch (error) {
      console.warn(`Modelo del satélite ${model} no disponible; se usa el procedural.`, error);
      return null;
    }
  };

  return {
    load,
    dispose(): void {
      disposed = true;
      loaded.forEach(disposeGltf);
      draco.dispose();
    },
  };
}

function disposeGltf(gltf: GLTF): void {
  gltf.scene.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.geometry.dispose();
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      disposeMaterial(material);
    }
  });
}

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value && typeof value === 'object' && 'isTexture' in value && (value as Texture).isTexture) {
      // envMap es compartido: lo libera el kit, no cada modelo.
      if ((material as MeshStandardMaterial).envMap !== value) (value as Texture).dispose();
    }
  }
  material.dispose();
}
