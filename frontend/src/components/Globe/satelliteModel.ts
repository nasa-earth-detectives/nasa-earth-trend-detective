import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PMREMGenerator, SphereGeometry, SRGBColorSpace, type Material, type Texture, type WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSatelliteGltfLoader } from './satelliteGltf';

/**
 * Satélite genérico de observación: cuerpo con lámina dorada (MLI), radiador, bloque de
 * instrumentos hacia el nadir, brazos y dos alas solares con celdas, y antena de alta ganancia.
 * Ejes del modelo: +Y lejos de la Tierra, -Y nadir (instrumentos), +Z avance, X alas.
 * Geometrías y materiales se comparten entre satélites; sólo la baliza lleva el color de misión.
 */
function canvasTexture(size: number, draw: (context: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) draw(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Lámina arrugada: parches de brillo irregular sobre dorado. */
function foilTexture(): CanvasTexture {
  return canvasTexture(128, (context) => {
    context.fillStyle = '#c9982e';
    context.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i += 1) {
      const light = 120 + Math.floor(Math.random() * 110);
      context.fillStyle = `rgba(${light + 60},${light + 20},${Math.floor(light * 0.35)},0.35)`;
      context.beginPath();
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      context.moveTo(x, y);
      for (let k = 0; k < 4; k += 1) context.lineTo(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 26);
      context.fill();
    }
  });
}

/** Celdas fotovoltaicas: azul profundo con rejilla plateada. */
function solarTexture(): CanvasTexture {
  return canvasTexture(256, (context) => {
    context.fillStyle = '#0c1d47';
    context.fillRect(0, 0, 256, 256);
    const cells = 8;
    for (let i = 0; i < cells; i += 1) {
      for (let j = 0; j < cells; j += 1) {
        const tint = 30 + Math.floor(Math.random() * 18);
        context.fillStyle = `rgb(${tint - 18},${tint + 2},${tint + 60})`;
        context.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
      }
    }
    context.strokeStyle = 'rgba(200,210,225,0.55)';
    context.lineWidth = 1;
    for (let i = 0; i <= cells; i += 1) {
      context.beginPath(); context.moveTo(i * 32, 0); context.lineTo(i * 32, 256); context.stroke();
      context.beginPath(); context.moveTo(0, i * 32); context.lineTo(256, i * 32); context.stroke();
    }
  });
}

export function createSatelliteKit(renderer: WebGLRenderer) {
  // Reflejos para el metal: sin mapa de entorno, el oro metálico se ve negro fuera del brillo especular.
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
  pmrem.dispose();
  const envMap: Texture = environment.texture;
  const gltf = createSatelliteGltfLoader(envMap);
  const textures = [foilTexture(), solarTexture()];
  const [foil, solar] = textures;

  const materials = {
    foil: new MeshStandardMaterial({ map: foil, color: '#ffffff', metalness: 0.95, roughness: 0.3,
      envMap, envMapIntensity: 1.1, emissive: new Color('#3a2806'), emissiveIntensity: 0.6 }),
    radiator: new MeshStandardMaterial({ color: '#e8ebf0', metalness: 0.1, roughness: 0.55, envMap, envMapIntensity: 0.6 }),
    dark: new MeshStandardMaterial({ color: '#2a2f38', metalness: 0.6, roughness: 0.45, envMap, envMapIntensity: 0.8 }),
    strut: new MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.8, roughness: 0.35, envMap, envMapIntensity: 0.9 }),
    solar: new MeshStandardMaterial({ map: solar, color: '#ffffff', metalness: 0.55, roughness: 0.28, envMap,
      envMapIntensity: 1, emissive: new Color('#0a1840'), emissiveIntensity: 0.55 }),
    dish: new MeshStandardMaterial({ color: '#f2f2ee', metalness: 0.2, roughness: 0.4, envMap, envMapIntensity: 0.7 }),
  };
  const geometries = {
    bus: new BoxGeometry(1.1, 1.0, 1.6),
    radiator: new BoxGeometry(1.0, 0.06, 1.4),
    instrument: new BoxGeometry(0.62, 0.34, 0.62),
    lens: new CylinderGeometry(0.16, 0.2, 0.22, 16),
    strut: new CylinderGeometry(0.035, 0.035, 0.9, 8),
    wing: new BoxGeometry(2.6, 0.04, 1.05),
    boom: new CylinderGeometry(0.03, 0.03, 0.7, 8),
    dish: new SphereGeometry(0.42, 20, 8, 0, Math.PI * 2, 0, 0.75),
    beacon: new SphereGeometry(0.11, 10, 8),
  };
  const ownMaterials: Material[] = [];

  /** Procedural al instante; el modelo NASA lo sustituye en cuanto llega. */
  const build = (accent: string, model3d: string, proceduralScale: number, gltfSize: number): Group => {
    const holder = new Group();
    const procedural = buildProcedural(accent);
    procedural.scale.setScalar(proceduralScale);
    holder.add(procedural);
    void gltf.load(model3d, gltfSize).then((real) => {
      if (!real) return;
      holder.remove(procedural);
      holder.add(real);
    });
    return holder;
  };

  const buildProcedural = (accent: string): Group => {
    const model = new Group();
    const add = (geometry: (typeof geometries)[keyof typeof geometries], material: Material,
      x: number, y: number, z: number, rotateZ = 0, rotateX = 0) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotateX, 0, rotateZ);
      mesh.raycast = () => {};
      model.add(mesh);
      return mesh;
    };
    add(geometries.bus, materials.foil, 0, 0, 0);
    add(geometries.radiator, materials.radiator, 0, 0.53, 0);
    add(geometries.instrument, materials.dark, 0, -0.67, 0.25);
    add(geometries.lens, materials.dark, 0, -0.9, 0.25);
    for (const side of [-1, 1]) {
      add(geometries.strut, materials.strut, side * 1.0, 0, 0, Math.PI / 2);
      add(geometries.wing, materials.solar, side * 2.75, 0, 0);
    }
    add(geometries.boom, materials.strut, 0, 0.2, -1.1, 0, Math.PI / 2);
    add(geometries.dish, materials.dish, 0, 0.55, -1.45, 0, -Math.PI / 3);
    const beaconMaterial = new MeshBasicMaterial({ color: accent, toneMapped: false });
    ownMaterials.push(beaconMaterial);
    const beacon = add(geometries.beacon, beaconMaterial, 0, 0.62, 0.7);
    model.userData.beacon = beacon;
    return model;
  };

  return {
    build,
    dispose(): void {
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      ownMaterials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      gltf.dispose();
    },
  };
}
