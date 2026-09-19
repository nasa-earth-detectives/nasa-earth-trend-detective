import { NASA_TEAM_PARTICIPANTS } from '../data/participants.data.js';
import { CreateTaskPayload } from '../types/clickup.types.js';
import {
  NasaSubtaskDefinition,
  NasaTaskDefinition,
  ParticipantProfile,
  ParticipantRole,
} from '../types/project.types.js';

export interface ParticipantTaskStats {
  participant: ParticipantProfile;
  totalTasks: number;
  totalEstimatedHours: number;
  tasks: NasaTaskDefinition[];
}

export class TaskDistributor {
  private readonly userMappings: Record<string, number | undefined>;

  constructor(userMappings: Record<string, number | undefined> = {}) {
    this.userMappings = userMappings;
  }

  getParticipantByRole(role: ParticipantRole): ParticipantProfile {
    const participant = NASA_TEAM_PARTICIPANTS.find((p) => p.role === role);
    if (!participant) {
      throw new Error(`No se encontró participante configurado para el rol: ${role}`);
    }
    return participant;
  }

  buildTaskPayload(task: NasaTaskDefinition): CreateTaskPayload {
    const participant = this.getParticipantByRole(task.assignedRole);
    const clickupUserId = this.userMappings[task.assignedRole];

    const markdownDescription = [
      `### 🎯 ${task.title}`,
      `**Código:** \`${task.code}\` | **Sprint:** ${task.sprint}`,
      `**Responsable Asignado:** ${participant.name} (${participant.title})`,
      `**Horas Estimadas:** ${task.estimatedHours}h`,
      '',
      '#### 📝 Descripción Técnica',
      task.description,
      '',
      '#### ✅ Criterios de Aceptación',
      ...task.acceptanceCriteria.map((c) => `- [ ] ${c}`),
      '',
      '#### 🚀 Definición de Terminado (DoD)',
      ...task.definitionOfDone.map((d) => `- [ ] ${d}`),
    ].join('\n');

    const assignees: number[] = [];
    if (clickupUserId) {
      assignees.push(clickupUserId);
    }

    return {
      name: `[${task.code}] ${task.title}`,
      description: task.description,
      markdown_description: markdownDescription,
      priority: task.priority,
      time_estimate: task.estimatedHours * 3600 * 1000, // milisegundos
      tags: [...task.tags, participant.role.toLowerCase().replace('_', '-')],
      assignees: assignees.length > 0 ? assignees : undefined,
    };
  }

  buildSubtaskPayload(
    subtask: NasaSubtaskDefinition,
    parentTaskId: string,
    parentTask: NasaTaskDefinition
  ): CreateTaskPayload {
    const participant = this.getParticipantByRole(parentTask.assignedRole);
    const clickupUserId = this.userMappings[parentTask.assignedRole];

    const markdownDescription = [
      `### 📌 Subtarea: ${subtask.title}`,
      `**Código:** \`${subtask.code}\` | **Tarea Padre:** \`[${parentTask.code}] ${parentTask.title}\``,
      `**Responsable Asignado:** ${participant.name} (${participant.title})`,
      `**Tiempo Estimado:** ${subtask.estimatedHours}h`,
      '',
      '#### 📝 Detalle Técnico',
      subtask.description,
    ].join('\n');

    const assignees: number[] = [];
    if (clickupUserId) {
      assignees.push(clickupUserId);
    }

    return {
      name: `[${subtask.code}] ${subtask.title}`,
      description: subtask.description,
      markdown_description: markdownDescription,
      parent: parentTaskId,
      priority: parentTask.priority,
      time_estimate: subtask.estimatedHours * 3600 * 1000,
      tags: [...parentTask.tags, 'subtask', participant.role.toLowerCase().replace('_', '-')],
      assignees: assignees.length > 0 ? assignees : undefined,
    };
  }

  getDistributionStats(tasks: NasaTaskDefinition[]): ParticipantTaskStats[] {
    return NASA_TEAM_PARTICIPANTS.map((participant) => {
      const assignedTasks = tasks.filter((t) => t.assignedRole === participant.role);
      const totalHours = assignedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

      return {
        participant,
        totalTasks: assignedTasks.length,
        totalEstimatedHours: totalHours,
        tasks: assignedTasks,
      };
    });
  }
}
