// Routes configuration for Task Management System

export const routes = {
  // Auth
  auth: '/auth',
  
  // Protected routes
  dashboard: '/dashboard',
  tasks: '/tasks',
  projects: '/projects',
  team: '/team',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof routes;
