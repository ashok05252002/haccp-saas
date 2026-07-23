/**
 * HACCP Service
 * Currently returns mock data. Replace with api calls for Laravel.
 */
import { haccpModules } from '../data/haccpModulesMockData';
import { haccpLogs } from '../data/haccpLogsMockData';

let localLogs = [...haccpLogs];

export const getHaccpModules = async () => {
  // Future: return api.get('/haccp/modules');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(haccpModules);
    }, 400);
  });
};

export const getHaccpLogs = async (date) => {
  // Future: return api.get('/haccp/logs', { params: { date } });
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = localLogs.filter((log) => log.date === date);
      resolve(filtered);
    }, 300);
  });
};

export const createHaccpLog = async (logData) => {
  // Future: return api.post('/haccp/logs', logData);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        ...logData,
        createdAt: new Date().toISOString(),
      };
      localLogs.push(newLog);
      resolve(newLog);
    }, 300);
  });
};

export const getHaccpStats = async (date) => {
  // Future: return api.get('/haccp/stats', { params: { date } });
  return new Promise((resolve) => {
    setTimeout(() => {
      const dateLogs = localLogs.filter((log) => log.date === date);
      const completedModules = new Set(dateLogs.map((l) => l.moduleId)).size;
      const failedChecks = dateLogs.filter((l) => l.status === 'Failed').length;
      resolve({
        completedModules,
        totalModules: 13,
        failedChecks,
      });
    }, 300);
  });
};
