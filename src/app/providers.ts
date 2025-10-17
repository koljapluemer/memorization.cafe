import { db } from './database';

// Make database available to the app
export function initializeDatabase() {
  return db;
}

// Helper to get current user ID (for future use)
export function getCurrentUserId(): string | undefined {
  return db.cloud.currentUserId;
}

// Register app-level providers
export function registerAppProviders() {
  // Initialize database
  initializeDatabase();

  // Future: Add other global providers here
}
