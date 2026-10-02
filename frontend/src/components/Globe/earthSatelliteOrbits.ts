import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
  type Scene,
} from 'three';

export interface SatelliteConfig {
  id: string;
  name: string;
  radius: number;
  inclinationDeg: number;
  speedRadPerSec: number;
  colorHex: number;
  initialAngle: number;
}

export const SATELLITE_MISSIONS: SatelliteConfig[] = [
  { id: 'terra', name: 'Terra (MODIS)', radius: 118, inclinationDeg: 98.2, speedRadPerSec: 0.08, colorHex: 0x00e5ff, initialAngle: 0 },
  { id: 'aqua', name: 'Aqua (MODIS)', radius: 120, inclinationDeg: 98.2, speedRadPerSec: 0.075, colorHex: 0x00aaff, initialAngle: Math.PI * 0.5 },
  { id: 'grace-fo', name: 'GRACE-FO (Ice Mass)', radius: 112, inclinationDeg: 89.0, speedRadPerSec: 0.09, colorHex: 0xc77dff, initialAngle: Math.PI * 1.2 },
  { id: 'oco2', name: 'OCO-2 (CO2 Mission)', radius: 122, inclinationDeg: 98.2, speedRadPerSec: 0.07, colorHex: 0xffd166, initialAngle: Math.PI * 1.7 },
];

function createOrbitTrack(radius: number, color: number): LineLoop {
  const points: Vector3[] = [];
  const segments = 64;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  const geo = new BufferGeometry().setFromPoints(points);
  const mat = new LineBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false });
  return new LineLoop(geo, mat);
}

function createSatelliteBody(color: number, radius: number): Group {
  const bodyGroup = new Group();

  // Núcleo del satélite
  const coreMesh = new Mesh(
    new SphereGeometry(0.85, 8, 8),
    new MeshBasicMaterial({ color, toneMapped: false })
  );

  // Paneles solares
  const panelsMesh = new Mesh(
    new BoxGeometry(2.8, 0.08, 0.8),
    new MeshBasicMaterial({ color: 0x003366, toneMapped: false })
  );

  // Haz/cono de escaneo apuntando hacia la Tierra (centro 0,0,0)
  const coneHeight = radius * 0.45;
  const beamMesh = new Mesh(
    new ConeGeometry(2.5, coneHeight, 8, 1, true),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0.08, depthWrite: false })
  );
  beamMesh.position.y = -coneHeight * 0.5;
  beamMesh.rotation.x = Math.PI;

  bodyGroup.add(coreMesh);
  bodyGroup.add(panelsMesh);
  bodyGroup.add(beamMesh);

  return bodyGroup;
}

export function createEarthSatelliteOrbits(scene: Scene) {
  const masterGroup = new Group();
  masterGroup.name = 'nasa-satellites-system';

  const satellites = SATELLITE_MISSIONS.map(cfg => {
    const orbitRing = createOrbitTrack(cfg.radius, cfg.colorHex);
    orbitRing.rotation.z = (cfg.inclinationDeg * Math.PI) / 180;

    const satBody = createSatelliteBody(cfg.colorHex, cfg.radius);
    const pivot = new Group();
    pivot.rotation.z = (cfg.inclinationDeg * Math.PI) / 180;
    pivot.add(satBody);

    masterGroup.add(orbitRing);
    masterGroup.add(pivot);

    return {
      cfg,
      pivot,
      satBody,
      angle: cfg.initialAngle,
      orbitRing,
    };
  });

  scene.add(masterGroup);

  let animationFrameId: number;
  let lastTime = performance.now();

  const update = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    for (const sat of satellites) {
      sat.angle += sat.cfg.speedRadPerSec * dt;
      const x = Math.cos(sat.angle) * sat.cfg.radius;
      const z = Math.sin(sat.angle) * sat.cfg.radius;
      sat.satBody.position.set(x, 0, z);
      sat.satBody.rotation.y = sat.angle + Math.PI * 0.5;
    }

    animationFrameId = requestAnimationFrame(update);
  };

  update();

  return {
    setVisible(visible: boolean) {
      masterGroup.visible = visible;
    },
    dispose() {
      cancelAnimationFrame(animationFrameId);
      scene.remove(masterGroup);
      for (const s of satellites) {
        s.orbitRing.geometry.dispose();
        (s.orbitRing.material as LineBasicMaterial).dispose();
      }
    },
  };
}
