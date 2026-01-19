/**
 * Appwrite Server-Side Client Configuration
 * This file should ONLY be used on the server-side (API routes)
 */

import { Client, Databases, Account } from "node-appwrite";

// Validate environment variables
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

// Create a new Appwrite client for each request
export function createAppwriteClient() {
  const client = new Client()
    .setEndpoint(getEnvVar("APPWRITE_ENDPOINT"))
    .setProject(getEnvVar("APPWRITE_PROJECT_ID"))
    .setKey(getEnvVar("APPWRITE_API_KEY"));

  return client;
}

// Helper to get Databases instance
export function getAppwriteDatabase() {
  const client = createAppwriteClient();
  return new Databases(client);
}

// Helper to get Account instance
export function getAppwriteAccount() {
  const client = createAppwriteClient();
  return new Account(client);
}

// Collection IDs
export const COLLECTIONS = {
  SPORTS: getEnvVar("APPWRITE_COLLECTION_SPORTS"),
  EVENTS: getEnvVar("APPWRITE_COLLECTION_EVENTS"),
  TEAMS: getEnvVar("APPWRITE_COLLECTION_TEAMS"),
  DRIVERS: getEnvVar("APPWRITE_COLLECTION_DRIVERS"),
} as const;

export const DATABASE_ID = getEnvVar("APPWRITE_DATABASE_ID");
