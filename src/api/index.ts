// API barrel export - Core APIs for task management

import { clientsAPI } from './clients.api';
import { tasksAPI } from './tasks.api';
import { aiAPI } from './ai.api';

export const api = {
  clients: clientsAPI,
  tasks: tasksAPI,
  ai: aiAPI,
};

export { clientsAPI } from './clients.api';
export { tasksAPI } from './tasks.api';
export { aiAPI } from './ai.api';
export { BaseAPI } from './base';
