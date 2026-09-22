/**
 * pr-audit-rules.mjs
 * Reglas de auditoría estática y políticas de evaluación para PRs.
 * Cumple con GEMINI.md: Anti God-Class (<200 líneas), Anti-Hardcoding y Blindaje.
 */

export const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.cs', '.py', '.php', '.go', '.rs', '.java'
];

export const IGNORED_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'asset-manifest.json'
];

export const BINARY_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.pdf',
  '.parquet', '.db', '.duckdb', '.lock'
];

/**
 * Determina si un archivo corresponde a código fuente ejecutable
 * para aplicar reglas de arquitectura (SRP, Anti God-Class).
 * @param {string} filename
 * @returns {boolean}
 */
export function isCodeFile(filename) {
  const lower = filename.toLowerCase();
  if (IGNORED_FILES.some(f => lower.endsWith(f))) return false;
  if (BINARY_EXTENSIONS.some(ext => lower.endsWith(ext))) return false;
  return CODE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export const AUDIT_POLICIES = {
  maxLinesPerFile: 200,
  warnLinesPerFile: 150,
  suspiciousPatterns: [
    { regex: /find\([0-9]+\)/i, message: 'Posible ID de registro quemado (find con número fijo)' },
    { regex: /===?\s*['"]https?:\/\//i, message: 'URL absoluta quemada en comparación directa' },
    { regex: /specularColor\s*=\s*vec3\s*\(\s*0\.04\s*\)/i, message: 'Uso de firma Three.js obsoleta (< 0.186)' },
    { regex: /customProgramCacheKey\s*=\s*\(\)\s*=>\s*['"][^'"]+['"]/i, message: 'customProgramCacheKey estático: causará reutilización de shaders sin texturas en Three.js' },
    { regex: /api_key\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]/i, message: 'Posible API Key o secreto quemado en código' }
  ],
  strictModeWarnings: [
    { regex: /_destructor\(\)/i, message: 'Destrucción de Three.js/Globe sin guardas para React 19 StrictMode' },
    { regex: /WebGLRenderer.*dispose/i, message: 'Dispose directo de WebGLRenderer durante el desmontaje en dev' }
  ]
};

/**
 * Realiza una auditoría estática rápida de un diff o archivo
 * @param {string} filename
 * @param {string} content
 * @returns {Array<{ type: 'error' | 'warning', message: string }>}
 */
export function auditCodeStatic(filename, content) {
  const issues = [];

  // Omitir archivos no considerados código fuente (binarios, lockfiles, docs)
  if (!isCodeFile(filename)) {
    return issues;
  }

  const lines = content.split('\n').length;

  if (lines > AUDIT_POLICIES.maxLinesPerFile) {
    issues.push({
      type: 'error',
      message: `El archivo supera el límite de ${AUDIT_POLICIES.maxLinesPerFile} líneas (${lines} líneas). Viola la regla Anti God-Class (SRP).`
    });
  } else if (lines > AUDIT_POLICIES.warnLinesPerFile) {
    issues.push({
      type: 'warning',
      message: `El archivo supera ${AUDIT_POLICIES.warnLinesPerFile} líneas (${lines} líneas). Considera refactorizarlo o dividir responsabilidades.`
    });
  }

  for (const { regex, message } of AUDIT_POLICIES.suspiciousPatterns) {
    if (regex.test(content)) {
      issues.push({ type: 'warning', message: `Patrón sospechoso en ${filename}: ${message}` });
    }
  }

  if (filename.includes('Globe') || filename.includes('three') || filename.includes('Scene')) {
    for (const { regex, message } of AUDIT_POLICIES.strictModeWarnings) {
      if (regex.test(content)) {
        issues.push({ type: 'warning', message: `Riesgo WebGL en ${filename}: ${message}` });
      }
    }
  }

  return issues;
}

/**
 * Genera el system prompt para el agente LLM basado en las reglas del repo
 */
export function buildReviewerSystemPrompt() {
  return `Eres un revisor de código senior automatizado para el proyecto "NASA Earth System Trend Detective".
Evalúa el diff del Pull Request contra las siguientes reglas OBLIGATORIAS del equipo:

1. MODULARIDAD ESTRICTA (ANTI GOD-CLASS):
   - Archivos concisos (< 150 a 200 líneas).
   - Separación de responsabilidades: Handlers, Hooks, DTOs, Service Layer.
2. CERO CÓDIGO QUEMADO (NO HARDCODING):
   - Prohibido quemar IDs de registros, URLs absolutas o constantes mágicas sin Enums.
   - Variables de entorno para servicios externos y configuraciones por DB.
3. THREE.JS / WEBGL & REACT 19 STRICT MODE:
   - Verificar que customProgramCacheKey sea dinámico si el material usa mapas o texturas.
   - Evitar destrucciones prematuras de WebGLRenderer en montajes dobles de StrictMode.
   - Comprobar compatibilidad con Three.js v0.186 (no usar fragmentos GLSL obsoletos).
4. SEGURIDAD Y PROTECCIÓN:
   - Formularios y mutaciones deben contemplar honeypots, rate limiting y sanitización.

Formato de respuesta:
Devuelve un informe estructurado en Markdown con:
- Resumen Ejecutivo (Aprobado / Requiere Cambios / Advertencias)
- Tabla de Cumplimiento de Reglas del Proyecto
- Hallazgos Críticos y Sugerencias de Código concretas (con diffs sugeridos).`;
}
