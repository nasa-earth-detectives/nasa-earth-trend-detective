import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Scene,
} from 'three';
import { GLOBE_RADIUS } from './globeConfig';

export interface UserLocationCoords {
  lat: number;
  lng: number;
}

export interface EarthUserLocationApi {
  setLocation(coords: UserLocationCoords | null): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * Marcador 3D "Tú estás aquí" en la superficie de la Tierra.
 * Presenta un núcleo brillante con ondas de radar concéntricas pulsantes.
 */
export function createEarthUserLocation(scene: Scene): EarthUserLocationApi {
  const root = new Group();
  root.name = 'earth-user-location';
  root.visible = false;
  scene.add(root);

  // Núcleo central luminoso
  const coreGeo = new SphereGeometry(0.7, 16, 16);
  const coreMat = new MeshBasicMaterial({
    color: 0x38bdf8, // Cyan NASA / Sci-fi
    depthTest: true,
  });
  const coreMesh = new Mesh(coreGeo, coreMat);
  coreMesh.raycast = () => {};
  root.add(coreMesh);

  // Anillos concéntricos pulsantes
  const ringGeo = new RingGeometry(0.8, 1.4, 32);
  const ringMat1 = new MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    side: DoubleSide,
    depthWrite: false,
  });
  const ringMat2 = new MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    side: DoubleSide,
    depthWrite: false,
  });

  const ringMesh1 = new Mesh(ringGeo, ringMat1);
  const ringMesh2 = new Mesh(ringGeo, ringMat2);
  ringMesh1.raycast = () => {};
  ringMesh2.raycast = () => {};
  root.add(ringMesh1);
  root.add(ringMesh2);

  let currentCoords: UserLocationCoords | null = null;
  let userVisible = true;
  let animId: number | null = null;
  let progress = 0;

  const updatePosition = (lat: number, lng: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const radius = GLOBE_RADIUS + 0.45; // Ligeramente elevado sobre los hexágonos y el relieve

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    root.position.set(x, y, z);
    const normal = root.position.clone().normalize();
    root.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
  };

  const animate = () => {
    progress = (progress + 0.015) % 1;

    // Primer anillo
    const scale1 = 1 + progress * 2.8;
    ringMesh1.scale.set(scale1, scale1, 1);
    ringMat1.opacity = Math.max(0, 1 - progress) * 0.75;

    // Segundo anillo (desfasado medio ciclo)
    const progress2 = (progress + 0.5) % 1;
    const scale2 = 1 + progress2 * 2.8;
    ringMesh2.scale.set(scale2, scale2, 1);
    ringMat2.opacity = Math.max(0, 1 - progress2) * 0.75;

    if (root.visible) {
      animId = requestAnimationFrame(animate);
    }
  };

  const startAnimation = () => {
    if (animId === null && root.visible) {
      animId = requestAnimationFrame(animate);
    }
  };

  const stopAnimation = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  return {
    setLocation(coords) {
      currentCoords = coords;
      if (!coords || !userVisible) {
        root.visible = false;
        stopAnimation();
        return;
      }
      updatePosition(coords.lat, coords.lng);
      root.visible = true;
      startAnimation();
    },
    setVisible(visible) {
      userVisible = visible;
      root.visible = visible && currentCoords !== null;
      if (root.visible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    },
    dispose() {
      stopAnimation();
      scene.remove(root);
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
    },
  };
}
