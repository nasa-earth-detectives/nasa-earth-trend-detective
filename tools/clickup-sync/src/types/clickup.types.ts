/**
 * ClickUp API v2 Type Definitions
 */

export enum ClickUpPriority {
  Urgent = 1,
  High = 2,
  Normal = 3,
  Low = 4,
}

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color?: string;
  initials?: string;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  members: Array<{
    user: ClickUpUser;
    role: number;
  }>;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  statuses?: Array<{
    id: string;
    status: string;
    type: string;
    orderindex: number;
    color: string;
  }>;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex?: number;
  override_statuses?: boolean;
  hidden?: boolean;
  space: {
    id: string;
    name: string;
  };
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex?: number;
  content?: string;
  status?: string;
  priority?: {
    priority: string;
    color: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    name: string;
  };
}

export interface CreateTaskPayload {
  name: string;
  description: string;
  markdown_description?: string;
  assignees?: number[];
  tags?: string[];
  status?: string;
  priority?: number;
  due_date?: number;
  time_estimate?: number; // in milliseconds
  notify_all?: boolean;
  parent?: string | null;
  links_to?: string | null;
  check_required_custom_fields?: boolean;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: {
    status: string;
    color: string;
    type: string;
    orderindex: number;
  };
  orderindex: string;
  date_created: string;
  date_updated: string;
  url: string;
  assignees: ClickUpUser[];
}
