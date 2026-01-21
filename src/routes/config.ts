// Routes configuration for Task Management System

export const routes = {
  // Public routes
  home: '/',
  auth: '/auth',
  privacyPolicy: '/privacy-policy',
  termsOfService: '/terms-of-service',
  
  // Protected routes
  dashboard: '/dashboard',
  tasks: '/tasks',
  projects: '/projects',
  team: '/team',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof routes;
