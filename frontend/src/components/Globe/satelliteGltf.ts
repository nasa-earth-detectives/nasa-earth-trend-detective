import { Group, Mesh, MeshStandardMaterial, type Material, type Texture } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Official NASA 3D models (NASA-3D-Resources) prepared with
 * scripts/satellites/prepare_nasa_satellites.py: solar arrays along X, +Y up, origin at
 * bus center, maximum bounding size 1, and physically-based materials (gold foil, solar cells, aluminum).
 * Draco compressed (reducing all four models from 6.2 MB to 1.96 MB).
 */
const base = import.meta.env.BASE_URL;

export function createSatelliteGltfLoader(envMap: Texture) {
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${base}draco/`);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const loaded: GLTF[] = [];
  let disposed = false;

  /** Loads model and returns it scene-ready; returns null on error (procedural fallback used). */
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
            // Subtle reflections: environment is a bright room and at intensity 1 gold rendered
            // almost white. In space the background is black and gold shines where lit by the sun.
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
      console.warn(`Satellite model ${model} unavailable; falling back to procedural.`, error);
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
      // envMap is shared: disposed by kit, not individual models.
      if ((material as MeshStandardMaterial).envMap !== value) (value as Texture).dispose();
    }
  }
  material.dispose();
}
