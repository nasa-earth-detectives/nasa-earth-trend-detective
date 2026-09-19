import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env local si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  apiToken: string;
  teamId: string;
  spaceName: string;
  folderName: string;
  isDryRun: boolean;
  participantClickupIds: Record<string, number | undefined>;
}

export function loadAppConfig(overrideDryRun = false): AppConfig {
  const apiToken = process.env.CLICKUP_API_TOKEN || '';
  const teamId = process.env.CLICKUP_TEAM_ID || '';
  const spaceName = process.env.CLICKUP_SPACE_NAME || 'NASA Space Apps 2026';
  const folderName = process.env.CLICKUP_FOLDER_NAME || 'NASA Earth System Trend Detective';

  const parseId = (val?: string): number | undefined => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) || num <= 0 ? undefined : num;
  };

  const participantClickupIds: Record<string, number | undefined> = {
    ROLE_BACKEND_LEAD: parseId(process.env.PARTICIPANT_1_CLICKUP_ID),
    ROLE_DATA_ENGINEER: parseId(process.env.PARTICIPANT_2_CLICKUP_ID),
    ROLE_DATA_SCIENTIST: parseId(process.env.PARTICIPANT_3_CLICKUP_ID),
    ROLE_FRONTEND_SPECIALIST: parseId(process.env.PARTICIPANT_4_CLICKUP_ID),
    ROLE_UIUX_QA_PITCH: parseId(process.env.PARTICIPANT_5_CLICKUP_ID),
  };

  return {
    apiToken,
    teamId,
    spaceName,
    folderName,
    isDryRun: overrideDryRun,
    participantClickupIds,
  };
}
