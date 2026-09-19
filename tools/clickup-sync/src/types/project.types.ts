import { ClickUpPriority } from './clickup.types.js';

/**
 * Roles especializados para los 5 participantes del proyecto NASA
 */
export enum ParticipantRole {
  BackendLead = 'ROLE_BACKEND_LEAD',
  DataEngineer = 'ROLE_DATA_ENGINEER',
  DataScientist = 'ROLE_DATA_SCIENTIST',
  FrontendSpecialist = 'ROLE_FRONTEND_SPECIALIST',
  UiUxQaPitch = 'ROLE_UIUX_QA_PITCH',
}

export interface ParticipantProfile {
  id: string;
  role: ParticipantRole;
  title: string;
  name: string;
  primaryTech: string[];
  responsibilities: string[];
  clickupUserId?: number;
}

export enum ProjectSprint {
  Sprint1 = 'Sprint 1: Datos, ETL y Arquitectura Base',
  Sprint2 = 'Sprint 2: Motor Científico y Pipeline Analítico',
  Sprint3 = 'Sprint 3: Experiencia 3D, Tendencias Opuestas e Integración',
  Sprint4 = 'Sprint 4: Pulido, Rigor Científico, QA y Pitch NASA',
}

export interface NasaSubtaskDefinition {
  code: string;
  title: string;
  estimatedHours: number;
  description: string;
}

export interface NasaTaskDefinition {
  code: string;
  title: string;
  sprint: ProjectSprint;
  assignedRole: ParticipantRole;
  priority: ClickUpPriority;
  estimatedHours: number;
  tags: string[];
  description: string;
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  subtasks?: NasaSubtaskDefinition[];
}
