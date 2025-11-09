/**
 * Storage adapter for lab reports
 * 
 * Provides structured JSON storage for UI display and timeseries aggregation.
 * Default implementation uses in-memory Map (for dev).
 */

import { LabReport } from "./types";

export interface LabsStorage {
  saveReport(userId: string, report: LabReport): Promise<LabReport>;
  listReports(userId: string): Promise<LabReport[]>;
  getReport(userId: string, id: string): Promise<LabReport | null>;
}

/**
 * In-memory storage adapter (default)
 */
class MemoryLabsStorage implements LabsStorage {
  private storage: Map<string, LabReport[]> = new Map();

  async saveReport(userId: string, report: LabReport): Promise<LabReport> {
    const userReports = this.storage.get(userId) || [];
    
    // Check if report with same ID exists, update it
    const existingIndex = userReports.findIndex((r) => r.id === report.id);
    if (existingIndex >= 0) {
      userReports[existingIndex] = report;
    } else {
      userReports.push(report);
    }

    this.storage.set(userId, userReports);
    return report;
  }

  async listReports(userId: string): Promise<LabReport[]> {
    const userReports = this.storage.get(userId) || [];
    // Return newest first (by date, or by insertion order)
    return userReports.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getReport(userId: string, id: string): Promise<LabReport | null> {
    const userReports = this.storage.get(userId) || [];
    return userReports.find((r) => r.id === id) || null;
  }
}

// Singleton instance
const storageAdapter: LabsStorage = new MemoryLabsStorage();

export function getLabsStorage(): LabsStorage {
  const adapter = process.env.LABS_STORAGE_ADAPTER || "memory";
  
  if (adapter === "memory") {
    return storageAdapter;
  }
  
  // Future: Add Azure/Cosmos/Postgres adapters here
  // For now, default to memory
  return storageAdapter;
}

