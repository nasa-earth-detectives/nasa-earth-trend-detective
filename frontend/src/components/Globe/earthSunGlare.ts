import {
  AdditiveBlending, CanvasTexture, Color, Group, SRGBColorSpace, Sprite, SpriteMaterial, type Scene, type Vector3,
} from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

/**
 * Visible Sun in its true direction (the same illuminating Earth) with lens flare. Three.js
 * Lensflare checks on-screen occlusion: when Earth blocks the sun, the flare disappears,
 * and peaking past the limb creates an "orbital sunrise".
 */
export const EARTH_SUN_CONFIG = {
  /** Beyond the star field (≤ 2,600) and within the far clip plane (6,500). */
  distance: 4000,
  /** Disk size with halo, in units at that distance (~3.7°). */
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
 * Disk with halo and diffraction spikes: the starburst look of orbital photography (aperture blades).
 * The spikes are thin and fade outward to avoid obstructing the scene.
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

/** Hexagonal aperture ghost (lens diaphragm), very subtle. */
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
  // Two small, subtle ghosts: larger ones looked like blemishes across Earth.
  flare.addElement(new LensflareElement(hexagon, 28, 0.6, new Color('#93c5fd')));
  flare.addElement(new LensflareElement(hexagon, 44, 0.9, new Color('#fcd34d')));
  flare.raycast = () => {};

  group.add(sprite, flare);
  const place = (): void => { group.position.copy(sunDirection).multiplyScalar(EARTH_SUN_CONFIG.distance); };
  place();
  // Sun direction shifts ~0.004° per second; repositioned each time it renders.
  sprite.onBeforeRender = place;
  scene.add(group);

  return {
    setVisible(visible: boolean): void {
      group.visible = visible;
    },
    dispose(): void {
      scene.remove(group);
      // Lensflare.dispose() also releases textures of its elements (glow and hexagon).
      flare.dispose();
      spriteMaterial.dispose();
      disc.dispose();
    },
  };
}
