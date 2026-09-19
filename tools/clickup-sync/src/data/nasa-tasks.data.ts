import { NasaTaskDefinition, ProjectSprint } from '../types/project.types.js';
import { SPRINT_1_TASKS } from './sprint1.tasks.js';
import { SPRINT_2_TASKS } from './sprint2.tasks.js';
import { SPRINT_3_TASKS } from './sprint3.tasks.js';
import { SPRINT_4_TASKS } from './sprint4.tasks.js';

/**
 * Matriz completa de las 20 tareas técnicas del proyecto NASA Earth System Trend Detective
 */
export const ALL_NASA_TASKS: NasaTaskDefinition[] = [
  ...SPRINT_1_TASKS,
  ...SPRINT_2_TASKS,
  ...SPRINT_3_TASKS,
  ...SPRINT_4_TASKS,
];

/**
 * Obtiene las tareas agrupadas por cada uno de los 4 Sprints
 */
export function getTasksBySprint(sprint: ProjectSprint): NasaTaskDefinition[] {
  return ALL_NASA_TASKS.filter((task) => task.sprint === sprint);
}
