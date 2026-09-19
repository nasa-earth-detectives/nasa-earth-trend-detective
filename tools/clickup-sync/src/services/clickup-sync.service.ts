import { AppConfig } from '../config/env.config.js';
import { ALL_NASA_TASKS, getTasksBySprint } from '../data/nasa-tasks.data.js';
import { ClickUpFolder, ClickUpList, ClickUpSpace } from '../types/clickup.types.js';
import { ProjectSprint } from '../types/project.types.js';
import { ClickUpClient } from './clickup-client.js';
import { TaskDistributor } from './task-distributor.js';

export class ClickUpSyncService {
  private readonly client: ClickUpClient;
  private readonly config: AppConfig;
  private readonly distributor: TaskDistributor;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new ClickUpClient(config.apiToken);
    this.distributor = new TaskDistributor(config.participantClickupIds);
  }

  async runDryRun(): Promise<void> {
    console.log('\n======================================================');
    console.log('🧪 MODO SIMULACIÓN (DRY-RUN) - NASA CLICKUP SYNC');
    console.log('======================================================\n');

    console.log(`📌 Espacio Destino: "${this.config.spaceName}"`);
    console.log(`📁 Carpeta de Proyecto: "${this.config.folderName}"`);
    console.log(`👥 Participantes: 5 miembros asignados`);
    console.log(`📋 Total de Tareas Definidas: ${ALL_NASA_TASKS.length}`);

    const stats = this.distributor.getDistributionStats(ALL_NASA_TASKS);
    console.log('\n📊 DISTRIBUCIÓN EQUILIBRADA POR PARTICIPANTE:');
    console.log('------------------------------------------------------');
    for (const stat of stats) {
      console.log(
        `👤 ${stat.participant.name.padEnd(32)} | Tareas: ${stat.totalTasks} | Horas: ${stat.totalEstimatedHours}h`
      );
      console.log(`   Rol: ${stat.participant.title}`);
      console.log(`   Techs: ${stat.participant.primaryTech.join(', ')}`);
    }

    const sprints = Object.values(ProjectSprint);
    console.log('\n📅 TAREAS Y SUBTAREAS POR SPRINT (4 SPRINTS):');
    console.log('------------------------------------------------------');
    for (const sprint of sprints) {
      const sprintTasks = getTasksBySprint(sprint);
      console.log(`\n🔹 [${sprint}] (${sprintTasks.length} tareas principales):`);
      for (const t of sprintTasks) {
        const payload = this.distributor.buildTaskPayload(t);
        const assigneeText = payload.assignees?.length
          ? `[ClickUp ID: ${payload.assignees.join(',')}]`
          : `[Rol: ${t.assignedRole}]`;
        console.log(`   • [${t.code}] ${t.title} (${t.estimatedHours}h) -> ${assigneeText}`);
        if (t.subtasks && t.subtasks.length > 0) {
          for (const sub of t.subtasks) {
            console.log(`     ↳ [${sub.code}] ${sub.title} (${sub.estimatedHours}h)`);
          }
        }
      }
    }

    console.log('\n✅ Simulación completada con éxito. 0 llamadas reales enviadas a ClickUp.');
  }

  async syncToClickUp(): Promise<void> {
    if (!this.config.apiToken) {
      throw new Error('CLICKUP_API_TOKEN no está definido en .env.');
    }
    if (!this.config.teamId) {
      throw new Error('CLICKUP_TEAM_ID no está definido en .env. Ejecuta npm run teams para obtenerlo.');
    }

    console.log('\n🚀 Iniciando sincronización real con ClickUp...');
    const space = await this.ensureSpace(this.config.teamId, this.config.spaceName);
    const folder = await this.ensureFolder(space.id, this.config.folderName);

    const sprints = Object.values(ProjectSprint);
    for (const sprint of sprints) {
      const list = await this.ensureList(folder.id, sprint);
      const tasks = getTasksBySprint(sprint);

      const existingTasks = await this.client.getTasks(list.id);
      if (existingTasks.length > 0) {
        console.log(`  🔄 Actualizando lista: removiendo ${existingTasks.length} tareas previas para reasignación limpia...`);
        for (const oldTask of existingTasks) {
          await this.client.deleteTask(oldTask.id);
        }
      }

      console.log(`\n📦 Creando tareas principales y subtareas en: "${sprint}" (${tasks.length} tareas)...`);

      for (const task of tasks) {
        const payload = this.distributor.buildTaskPayload(task);
        const createdTask = await this.client.createTask(list.id, payload);
        console.log(`  ✓ Tarea Principal [${task.code}]: ${createdTask.name}`);

        if (task.subtasks && task.subtasks.length > 0) {
          for (const subtask of task.subtasks) {
            const subPayload = this.distributor.buildSubtaskPayload(subtask, createdTask.id, task);
            const createdSubtask = await this.client.createTask(list.id, subPayload);
            console.log(`    ↳ Subtarea [${subtask.code}]: ${createdSubtask.name}`);
          }
        }
      }
    }

    console.log('\n🎉 ¡Sincronización completada exitosamente en ClickUp!');
  }

  private async ensureSpace(teamId: string, name: string): Promise<ClickUpSpace> {
    const spaces = await this.client.getSpaces(teamId);
    const existing = spaces.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      console.log(`✓ Espacio encontrado: "${existing.name}" (ID: ${existing.id})`);
      return existing;
    }
    console.log(`+ Creando nuevo Espacio: "${name}"...`);
    return await this.client.createSpace(teamId, name);
  }

  private async ensureFolder(spaceId: string, name: string): Promise<ClickUpFolder> {
    const folders = await this.client.getFolders(spaceId);
    const existing = folders.find((f) => f.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      console.log(`✓ Carpeta encontrada: "${existing.name}" (ID: ${existing.id})`);
      return existing;
    }
    console.log(`+ Creando nueva Carpeta: "${name}"...`);
    return await this.client.createFolder(spaceId, name);
  }

  private async ensureList(folderId: string, name: string): Promise<ClickUpList> {
    const lists = await this.client.getLists(folderId);
    const existing = lists.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      console.log(`✓ Lista existente: "${existing.name}" (ID: ${existing.id})`);
      return existing;
    }
    console.log(`+ Creando nueva Lista: "${name}"...`);
    return await this.client.createList(folderId, name);
  }
}
