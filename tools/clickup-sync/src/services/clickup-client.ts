import {
  ClickUpFolder,
  ClickUpList,
  ClickUpSpace,
  ClickUpTask,
  ClickUpTeam,
  CreateTaskPayload,
} from '../types/clickup.types.js';

export class ClickUpClient {
  private readonly baseUrl = 'https://api.clickup.com/api/v2';
  private readonly apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken.trim();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiToken) {
      throw new Error('ClickUp API Token no configurado. Revisa tu archivo .env');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: this.apiToken,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: { err?: string; ECODE?: string } = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Ignorar si no es JSON válido
      }
      const message = errorJson.err || `Error HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`[ClickUp API Error] ${message} (${url})`);
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  }

  async getTeams(): Promise<ClickUpTeam[]> {
    const data = await this.request<{ teams: ClickUpTeam[] }>('/team');
    return data.teams || [];
  }

  async getSpaces(teamId: string): Promise<ClickUpSpace[]> {
    const data = await this.request<{ spaces: ClickUpSpace[] }>(`/team/${teamId}/space`);
    return data.spaces || [];
  }

  async createSpace(teamId: string, name: string): Promise<ClickUpSpace> {
    return await this.request<ClickUpSpace>(`/team/${teamId}/space`, {
      method: 'POST',
      body: JSON.stringify({ name, multiple_assignees: true }),
    });
  }

  async getFolders(spaceId: string): Promise<ClickUpFolder[]> {
    const data = await this.request<{ folders: ClickUpFolder[] }>(`/space/${spaceId}/folder`);
    return data.folders || [];
  }

  async createFolder(spaceId: string, name: string): Promise<ClickUpFolder> {
    return await this.request<ClickUpFolder>(`/space/${spaceId}/folder`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getLists(folderId: string): Promise<ClickUpList[]> {
    const data = await this.request<{ lists: ClickUpList[] }>(`/folder/${folderId}/list`);
    return data.lists || [];
  }

  async createList(folderId: string, name: string): Promise<ClickUpList> {
    return await this.request<ClickUpList>(`/folder/${folderId}/list`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async createTask(listId: string, payload: CreateTaskPayload): Promise<ClickUpTask> {
    return await this.request<ClickUpTask>(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTasks(listId: string): Promise<Array<{ id: string; name: string }>> {
    const data = await this.request<{ tasks: Array<{ id: string; name: string }> }>(
      `/list/${listId}/task?archived=false`
    );
    return data.tasks || [];
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request(`/task/${taskId}`, {
      method: 'DELETE',
    });
  }
}
