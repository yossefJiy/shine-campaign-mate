// API barrel export - Core APIs for task management

import { clientsAPI } from './clients.api';
import { tasksAPI } from './tasks.api';

export const api = {
  clients: clientsAPI,
  tasks: tasksAPI,
};

export { clientsAPI } from './clients.api';
export { tasksAPI } from './tasks.api';
export { BaseAPI } from './base';
