import { Color, MeshStandardMaterial, ShaderChunk, Vector2, Vector3 } from 'three';
import { EARTH_MATERIAL_CONFIG } from './earthConfig';

/** GGX de Three, con rugosidad e índice óptico distintos para agua y terreno.
 * La máscara ocupa roughnessMap: se muestrea una vez, sin otro mapa ni otro pase.
 * Conserva iluminación, normales, gestión de color y tone mapping nativos.
 */
export function createEarthMaterial(): MeshStandardMaterial {
  const config = EARTH_MATERIAL_CONFIG;
  const material = new MeshStandardMaterial({
    color: config.fallbackColor,
    metalness: 0,
    roughness: config.landRoughness,
    bumpScale: config.bumpScale,
  });
  material.name = 'earth-day-surface';
  material.onBeforeCompile = shader => {
    shader.uniforms.earthLandRoughness = { value: config.landRoughness };
    shader.uniforms.earthOceanRoughness = { value: config.oceanRoughness };
    shader.uniforms.earthOceanF0 = { value: ((config.waterIor - 1) / (config.waterIor + 1)) ** 2 };
    shader.uniforms.earthSourceOcean = { value: new Color(config.sourceOceanFill) };
    shader.uniforms.earthDeepWater = { value: new Vector3(...config.deepWaterReflectance) };
    shader.uniforms.earthFillTolerance = { value: new Vector2(...config.oceanFillTolerance) };
    shader.fragmentShader = `uniform float earthLandRoughness;
uniform float earthOceanRoughness;
uniform float earthOceanF0;
uniform vec3 earthSourceOcean;
uniform vec3 earthDeepWater;
uniform vec2 earthFillTolerance;
${shader.fragmentShader}`
      .replace('#include <roughnessmap_fragment>', `
float earthWater = 0.0;
#ifdef USE_ROUGHNESSMAP
  earthWater = texture2D(roughnessMap, vRoughnessMapUv).g;
#endif
float roughnessFactor = mix(earthLandRoughness, earthOceanRoughness, earthWater);
// Corrige el nivel del relleno sin borrar la variación costera de la fuente.
float earthPlaceholder = 1.0 - smoothstep(earthFillTolerance.x, earthFillTolerance.y,
  length(diffuseColor.rgb - earthSourceOcean));
diffuseColor.rgb += (earthDeepWater - earthSourceOcean) * earthWater * earthPlaceholder;
`)
      .replace('#include <lights_physical_fragment>', ShaderChunk.lights_physical_fragment.replace(
        'material.specularColor = vec3( 0.04 );',
        'material.specularColor = vec3(mix(0.04, earthOceanF0, earthWater));',
      ));
  };
  material.customProgramCacheKey = () => 'earth-day-ggx-v3';
  return material;
}
