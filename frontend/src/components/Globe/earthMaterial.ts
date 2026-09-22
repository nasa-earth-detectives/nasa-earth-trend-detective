import { Color, MeshStandardMaterial, ShaderChunk, Vector2, Vector3 } from 'three';
import { EARTH_MATERIAL_CONFIG, EARTH_SOLAR_CONFIG } from './earthConfig';

/** GGX de Three, con rugosidad e índice óptico distintos para agua y terreno.
 * La máscara ocupa roughnessMap: se muestrea una vez, sin otro mapa ni otro pase.
 * Conserva iluminación, normales, gestión de color y tone mapping nativos.
 */
export function createEarthMaterial(sunDirection: Vector3): MeshStandardMaterial {
  const config = EARTH_MATERIAL_CONFIG;
  const material = new MeshStandardMaterial({
    color: config.fallbackColor,
    metalness: 0,
    roughness: config.landRoughness,
    bumpScale: config.bumpScale,
    emissive: 0xffffff,
    emissiveIntensity: EARTH_SOLAR_CONFIG.nightIntensity,
  });
  material.name = 'earth-orbital-surface';
  material.onBeforeCompile = shader => {
    // Fallar explícitamente si cambia el contrato del chunk al actualizar Three.
    if (!ShaderChunk.lights_physical_fragment.includes('material.specularColor = vec3( 0.04 );')
      || !shader.vertexShader.includes('#include <beginnormal_vertex>')
      || !shader.fragmentShader.includes('#include <emissivemap_fragment>')
      || !shader.fragmentShader.includes('#include <roughnessmap_fragment>')
      || !shader.fragmentShader.includes('#include <lights_physical_fragment>')) {
      throw new Error('Earth material: incompatible Three.js shader chunks');
    }
    shader.uniforms.earthLandRoughness = { value: config.landRoughness };
    shader.uniforms.earthOceanRoughness = { value: config.oceanRoughness };
    shader.uniforms.earthOceanF0 = { value: ((config.waterIor - 1) / (config.waterIor + 1)) ** 2 };
    shader.uniforms.earthSourceOcean = { value: new Color(config.sourceOceanFill) };
    shader.uniforms.earthDeepWater = { value: new Vector3(...config.deepWaterReflectance) };
    shader.uniforms.earthFillTolerance = { value: new Vector2(...config.oceanFillTolerance) };
    shader.uniforms.earthSunDirection = { value: sunDirection };
    shader.uniforms.earthDuskRange = { value: new Vector2(EARTH_SOLAR_CONFIG.duskEnd, EARTH_SOLAR_CONFIG.duskStart) };
    shader.vertexShader = `varying vec3 vEarthWorldNormal;\n${shader.vertexShader}`
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vEarthWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = `varying vec3 vEarthWorldNormal;
uniform vec3 earthSunDirection;
uniform vec2 earthDuskRange;
uniform float earthLandRoughness;
uniform float earthOceanRoughness;
uniform float earthOceanF0;
uniform vec3 earthSourceOcean;
uniform vec3 earthDeepWater;
uniform vec2 earthFillTolerance;
${shader.fragmentShader}`
      .replace('#include <emissivemap_fragment>', `
#ifdef USE_EMISSIVEMAP
  vec3 earthNight = texture2D(emissiveMap, vEmissiveMapUv).rgb;
  float earthSunCosine = dot(normalize(vEarthWorldNormal), earthSunDirection);
  float earthNightWeight = 1.0 - smoothstep(earthDuskRange.x, earthDuskRange.y, earthSunCosine);
  totalEmissiveRadiance *= earthNight * earthNightWeight;
#else
  totalEmissiveRadiance = vec3(0.0);
#endif
`)
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
      .replace('#include <lights_physical_fragment>', ShaderChunk.lights_physical_fragment
        // Three.js v0.186+: la rama #else (sin IOR) contiene:
        //   material.specularColor = vec3( 0.04 );
        //   material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
        // specularColorBlended utiliza este F0 sin modificar energía del terreno.
        .replace(
          'material.specularColor = vec3( 0.04 );',
          'material.specularColor = vec3(mix(0.04, earthOceanF0, earthWater));',
        ));
  };
  // Three incluye las variantes map/bump/roughnessMap en su clave nativa.
  // Esta versión distingue únicamente nuestra modificación del shader GGX.
  material.customProgramCacheKey = () => 'earth-orbital-ggx-v5';
  return material;
}
