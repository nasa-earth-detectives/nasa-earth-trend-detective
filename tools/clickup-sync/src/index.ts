import { loadAppConfig } from './config/env.config.js';
import { ClickUpClient } from './services/clickup-client.js';
import { ClickUpSyncService } from './services/clickup-sync.service.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.length === 0;
  const isListTeams = args.includes('--list-teams') || args.includes('--teams');
  const isSync = args.includes('--sync');

  const config = loadAppConfig(isDryRun);

  console.log('🛰️ ========================================================');
  console.log('   NASA EARTH SYSTEM TREND DETECTIVE - CLICKUP CONNECTOR');
  console.log('   Space Apps Challenge 2026 | Asignación a 5 Participantes');
  console.log('========================================================\n');

  if (isListTeams) {
    if (!config.apiToken) {
      console.error('❌ Error: Debes configurar CLICKUP_API_TOKEN en tu archivo .env');
      process.exit(1);
    }
    console.log('🔍 Consultando Workspaces (Teams) en ClickUp...');
    const client = new ClickUpClient(config.apiToken);
    const teams = await client.getTeams();

    console.log(`\n✅ Se encontraron ${teams.length} Workspace(s):`);
    for (const team of teams) {
      console.log(`\n🏢 Workspace: "${team.name}" | ID: ${team.id}`);
      console.log('   👥 Miembros detectados:');
      for (const member of team.members) {
        const username = (member.user.username || 'Invitado (Pendiente)').padEnd(25);
        const email = (member.user.email || 'Sin correo').padEnd(35);
        console.log(`      • ${username} | Email: ${email} | ID: ${member.user.id}`);
      }
    }
    console.log('\n💡 Copia el ID de tu Workspace y ponlo en CLICKUP_TEAM_ID en tu .env');
    return;
  }

  const syncService = new ClickUpSyncService(config);

  if (isSync) {
    await syncService.syncToClickUp();
  } else {
    await syncService.runDryRun();
    console.log('\n💡 Sugerencia: Para sincronizar en vivo con ClickUp:');
    console.log('   1. Configura tu token en .env');
    console.log('   2. Ejecuta: npm run teams (para ver IDs)');
    console.log('   3. Ejecuta: npm run sync\n');
  }
}

main().catch((err: unknown) => {
  const error = err as Error;
  console.error('\n❌ Ocurrió un error en la ejecución:', error.message);
  process.exit(1);
});
