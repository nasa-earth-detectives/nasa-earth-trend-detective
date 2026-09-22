/**
 * ai-pr-reviewer.mjs
 * Script ejecutor del Agente Revisor de Pull Requests para GitHub Actions.
 * Compatible con Node 18+ (fetch nativo, ESM). Cero dependencias externas pesadas.
 */

import { execSync } from 'node:child_process';
import { auditCodeStatic, buildReviewerSystemPrompt } from './pr-audit-rules.mjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const PR_NUMBER = process.env.PR_NUMBER || '';
const REPO = process.env.REPO || '';
const BASE_REF = process.env.BASE_REF || 'development';
const IS_DRY_RUN = process.argv.includes('--dry-run');

function getGitDiff(baseBranch) {
  try {
    return execSync(`git diff origin/${baseBranch}...HEAD`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    try {
      return execSync('git diff HEAD~1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      return '';
    }
  }
}

function getChangedFiles(baseBranch) {
  try {
    const output = execSync(`git diff --name-only origin/${baseBranch}...HEAD`, { encoding: 'utf-8' });
    return output.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function callGeminiApi(diffText, staticIssues) {
  const systemPrompt = buildReviewerSystemPrompt();
  const userPrompt = `Revisa el siguiente diff de Pull Request.\n\n` +
    `Hallazgos estáticos preliminares:\n${JSON.stringify(staticIssues, null, 2)}\n\n` +
    `Diff del PR:\n\`\`\`diff\n${diffText.slice(0, 50000)}\n\`\`\``;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el reporte de IA.';
}

function generateStaticReport(changedFiles, issues) {
  const hasErrors = issues.some(i => i.type === 'error');
  const statusBadge = hasErrors ? '🔴 Requiere Cambios' : issues.length > 0 ? '🟡 Aprobado con Observaciones' : '🟢 Aprobado';

  let md = `## 🤖 NASA PR Reviewer — Auditoría Automatizada\n\n`;
  md += `**Veredicto:** ${statusBadge}\n\n`;
  md += `### 📁 Archivos Evaluados (${changedFiles.length})\n`;
  changedFiles.forEach(f => { md += `- \`${f}\`\n`; });

  md += `\n### 📋 Cumplimiento de Reglas del Proyecto (GEMINI.md)\n`;
  md += `| Regla | Estado | Detalle |\n| :--- | :---: | :--- |\n`;
  md += `| **Modularidad (<200 líneas)** | ${hasErrors ? '❌' : '✅'} | ${hasErrors ? 'Se detectaron archivos extensos' : 'Archivos concisos'} |\n`;
  md += `| **Anti-Hardcoding** | ${issues.some(i => i.message.includes('quemado')) ? '⚠️' : '✅'} | Verificación de IDs y URLs fijas |\n`;
  md += `| **Three.js / WebGL & React 19** | ${issues.some(i => i.message.includes('WebGL') || i.message.includes('Three')) ? '⚠️' : '✅'} | Ciclo de vida y shaders |\n`;

  if (issues.length > 0) {
    md += `\n### ⚠️ Hallazgos Detectados\n`;
    issues.forEach(issue => {
      const icon = issue.type === 'error' ? '🚫' : '⚠️';
      md += `* ${icon} **[${issue.type.toUpperCase()}]:** ${issue.message}\n`;
    });
  } else {
    md += `\n✨ *No se detectaron violaciones de arquitectura en el análisis preliminar.*\n`;
  }

  return md;
}

async function postCommentToPr(commentBody) {
  if (!GITHUB_TOKEN || !REPO || !PR_NUMBER) {
    console.log('ℹ️ Omitiendo publicación en GitHub (Faltan variables GITHUB_TOKEN, REPO o PR_NUMBER).');
    return;
  }

  const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: commentBody })
  });

  if (res.ok) {
    console.log(`✅ Comentario publicado con éxito en el PR #${PR_NUMBER}`);
  } else {
    console.error(`❌ Error al publicar comentario en PR:`, await res.text());
  }
}

async function main() {
  console.log(`🔍 Iniciando revisión de PR para base: origin/${BASE_REF}...`);
  const diff = getGitDiff(BASE_REF);
  const files = getChangedFiles(BASE_REF);

  const staticIssues = [];
  for (const file of files) {
    try {
      const content = execSync(`git show HEAD:${file}`, { encoding: 'utf-8' });
      staticIssues.push(...auditCodeStatic(file, content));
    } catch {
      // Archivo eliminado o inaccesible
    }
  }

  let finalReport = '';
  if (GEMINI_API_KEY) {
    try {
      console.log('🧠 Consultando agente Gemini con el diff del PR...');
      const aiReview = await callGeminiApi(diff, staticIssues);
      finalReport = `## 🤖 NASA PR Reviewer — Auditoría de IA (Gemini)\n\n${aiReview}`;
    } catch (err) {
      console.warn('⚠️ Fallo en llamada a Gemini API, usando reporte estático:', err.message);
      finalReport = generateStaticReport(files, staticIssues);
    }
  } else {
    console.log('ℹ️ GEMINI_API_KEY no configurada. Generando reporte de auditoría estática...');
    finalReport = generateStaticReport(files, staticIssues);
  }

  if (IS_DRY_RUN || !GITHUB_TOKEN) {
    console.log('\n--- [REPORTE GENERADO (DRY-RUN)] ---\n');
    console.log(finalReport);
    console.log('\n--- FIN DE REPORTE ---\n');
  }

  if (!IS_DRY_RUN && GITHUB_TOKEN && PR_NUMBER) {
    await postCommentToPr(finalReport);
  }
}

main().catch(err => {
  console.error('❌ Error no controlado en AI PR Reviewer:', err);
  process.exit(1);
});
