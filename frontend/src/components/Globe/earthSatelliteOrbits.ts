import { Group, Matrix4, Vector3, type Camera, type Scene, type WebGLRenderer } from 'three';
import { GLOBE_RADIUS } from './globeConfig';
import { EARTH_SATELLITE_CONFIG, SATELLITE_MISSIONS } from './satelliteMissions';
import { createSatelliteKit } from './satelliteModel';
import { createSatelliteScan, orbitPoint } from './satelliteScan';

const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/**
 * Mission constellation (Terra, Aqua, OCO-2, GRACE-FO) with true orbits exaggerated in altitude.
 *
 * Previously each satellite had its own requestAnimationFrame that kept running even when the layer
 * was hidden, and only orbits were released on unmount. Animation now runs within the layer's own
 * onBeforeRender (if not rendered, not computed), and dispose cleanly releases all resources.
 */
export function createEarthSatelliteOrbits(scene: Scene, renderer: WebGLRenderer, sunDirection: Vector3) {
  const config = EARTH_SATELLITE_CONFIG;
  const root = new Group();
  root.name = 'nasa-satellites-system';
  const kit = createSatelliteKit(renderer);
  const trailSegments = 32;

  const satellites = SATELLITE_MISSIONS.map((mission) => {
    const radius = GLOBE_RADIUS * (1 + (mission.altitudeKm / EARTH_RADIUS_KM) * config.altitudeExaggeration);
    const inclination = mission.inclinationDeg * DEG;
    const pivot = new Group();
    const frame = new Group();
    const model = kit.build(mission.accent, mission.model, config.modelScale, config.gltfSize);
    const scan = createSatelliteScan(mission.accent, radius, inclination, config.orbitDots, trailSegments);
    // Cone and footprint hang from satellite toward nadir (-Y of frame).
    const groundDistance = radius - GLOBE_RADIUS * 1.008;
    const swath = mission.swathHalfWidth * GLOBE_RADIUS;
    scan.cone.scale.set(swath, groundDistance, swath);
    scan.cone.position.y = -groundDistance / 2;
    scan.footprint.scale.setScalar(swath);
    scan.footprint.position.y = -groundDistance;
    frame.add(model, scan.cone, scan.footprint);
    pivot.add(frame, scan.orbit, scan.trail);
    root.add(pivot);
    return { mission, radius, inclination, pivot, frame, model, scan };
  });

  const position = new Float32Array(3);
  const up = new Vector3();
  const forward = new Vector3();
  const right = new Vector3();
  const basis = new Matrix4();
  const trailRadians = config.trailDegrees * DEG;

  const update = (_renderer?: unknown, _scene?: unknown, camera?: Camera): void => {
    const seconds = performance.now() / 1000;
    // Close to ground, camera enters cones and footprint: they fade between 0.45 and
    // 0.12 radii altitude (previously filling half the screen with green and orange).
    const altitude = camera ? camera.position.length() / GLOBE_RADIUS - 1 : 2;
    const t = Math.min(1, Math.max(0, (altitude - 0.12) / (0.45 - 0.12)));
    const coneFade = t * t * (3 - 2 * t);
    // Subsolar longitude in getCoords frame: dir = (cos φ sin λ, sin φ, cos φ cos λ).
    const subsolarLongitude = Math.atan2(sunDirection.x, sunDirection.z);
    for (const satellite of satellites) {
      const { mission, radius, inclination, pivot, frame, scan } = satellite;
      pivot.rotation.y = subsolarLongitude + (mission.ascendingNodeLocalTime === null
        ? (mission.illustrativeNodeOffsetDeg ?? 0) * DEG
        : (mission.ascendingNodeLocalTime - 12) * 15 * DEG);
      const u = mission.phase + (2 * Math.PI * seconds * config.timeScale) / (mission.periodMin * 60);
      orbitPoint(radius, inclination, u, position, 0);
      frame.position.set(position[0], position[1], position[2]);
      up.set(position[0], position[1], position[2]).normalize();
      forward.set(Math.cos(u) * Math.cos(inclination), Math.cos(u) * Math.sin(inclination), -Math.sin(u));
      right.crossVectors(up, forward);
      frame.quaternion.setFromRotationMatrix(basis.makeBasis(right, up, forward));
      scan.coneMaterial.uniforms.time.value = seconds;
      scan.coneMaterial.uniforms.fade.value = coneFade;
      scan.cone.visible = scan.footprint.visible = coneFade > 0.01;
      scan.footprintMaterial.opacity = (0.18 + 0.22 * (0.5 + 0.5 * Math.sin(seconds * 3 + mission.phase))) * coneFade;
      scan.updateTrail(u, trailRadians);
    }
  };
  // The first satellite orbit acts as driver clock: only runs while the layer is rendered.
  const driver = satellites[0].scan.orbit;
  driver.frustumCulled = false;
  driver.onBeforeRender = update;
  update();
  scene.add(root);

  return {
    setVisible(visible: boolean): void {
      root.visible = visible;
    },
    dispose(): void {
      driver.onBeforeRender = () => {};
      scene.remove(root);
      satellites.forEach((satellite) => satellite.scan.dispose());
      kit.dispose();
    },
  };
}
