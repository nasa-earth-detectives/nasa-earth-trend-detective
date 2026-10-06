import {
  AdditiveBlending, CanvasTexture, Color, Group, SRGBColorSpace, Sprite, SpriteMaterial, type Scene, type Vector3,
} from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

/**
 * Sol visible en su dirección real (la misma que ilumina la Tierra) con destello de lente. El
 * Lensflare de three comprueba en pantalla si algo tapa el sol: cuando la Tierra lo oculta, el
 * destello desaparece, y al asomar por el limbo aparece el "amanecer orbital".
 */
export const EARTH_SUN_CONFIG = {
  /** Más allá de las estrellas (≤ 2.600) y dentro del plano lejano (6.500). */
  distance: 4000,
  /** Tamaño del disco con halo, en unidades a esa distancia (~3,7°). */
  spriteSize: 260,
} as const;

function radialTexture(stops: Array<[number, string]>, size = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Disco con halo y rayos de difracción: el destello en estrella de las fotos orbitales (las aspas
 * del diafragma). Los rayos son finos y se desvanecen hacia fuera para no tapar la escena.
 */
function starburstTexture(size = 512): CanvasTexture {
  const texture = radialTexture([[0, 'rgba(255,255,255,1)'], [0.05, 'rgba(255,250,238,1)'],
    [0.12, 'rgba(255,220,160,0.6)'], [0.35, 'rgba(255,175,95,0.14)'], [1, 'rgba(255,140,60,0)']], size);
  const context = (texture.image as HTMLCanvasElement).getContext('2d');
  if (context) {
    context.globalCompositeOperation = 'lighter';
    const center = size / 2;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i * Math.PI) / 3 + 0.26;
      const gradient = context.createLinearGradient(center, center, center + Math.cos(angle) * center,
        center + Math.sin(angle) * center);
      gradient.addColorStop(0, 'rgba(255,245,225,0.55)');
      gradient.addColorStop(1, 'rgba(255,245,225,0)');
      context.strokeStyle = gradient;
      context.lineWidth = i % 2 === 0 ? 2.2 : 1.2;
      context.beginPath();
      context.moveTo(center, center);
      context.lineTo(center + Math.cos(angle) * center, center + Math.sin(angle) * center);
      context.stroke();
    }
    texture.needsUpdate = true;
  }
  return texture;
}

/** Fantasma hexagonal (diafragma de la lente), muy tenue. */
function hexagonTexture(size = 128): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 6 + (i * Math.PI) / 3;
      context.lineTo(size / 2 + Math.cos(angle) * size * 0.46, size / 2 + Math.sin(angle) * size * 0.46);
    }
    context.closePath();
    context.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createEarthSunGlare(scene: Scene, sunDirection: Vector3) {
  const group = new Group();
  group.name = 'earth-sun-glare';
  const disc = starburstTexture();
  const glow = radialTexture([[0, 'rgba(255,240,215,0.9)'], [0.2, 'rgba(255,200,140,0.25)'], [1, 'rgba(255,160,90,0)']]);
  const hexagon = hexagonTexture();

  const spriteMaterial = new SpriteMaterial({ map: disc, blending: AdditiveBlending, transparent: true,
    depthWrite: false, toneMapped: false, fog: false });
  const sprite = new Sprite(spriteMaterial);
  sprite.scale.setScalar(EARTH_SUN_CONFIG.spriteSize);
  sprite.frustumCulled = false;
  sprite.raycast = () => {};

  const flare = new Lensflare();
  flare.addElement(new LensflareElement(glow, 420, 0, new Color('#fff1dc')));
  // Dos fantasmas pequeños y casi transparentes: más grandes parecían manchas sobre la Tierra.
  flare.addElement(new LensflareElement(hexagon, 28, 0.6, new Color('#93c5fd')));
  flare.addElement(new LensflareElement(hexagon, 44, 0.9, new Color('#fcd34d')));
  flare.raycast = () => {};

  group.add(sprite, flare);
  const place = (): void => { group.position.copy(sunDirection).multiplyScalar(EARTH_SUN_CONFIG.distance); };
  place();
  // La dirección del sol cambia ~0,004° por segundo; se recoloca cada vez que se dibuja.
  sprite.onBeforeRender = place;
  scene.add(group);

  return {
    setVisible(visible: boolean): void {
      group.visible = visible;
    },
    dispose(): void {
      scene.remove(group);
      // Lensflare.dispose() libera también las texturas de sus elementos (glow y hexágono).
      flare.dispose();
      spriteMaterial.dispose();
      disc.dispose();
    },
  };
}
