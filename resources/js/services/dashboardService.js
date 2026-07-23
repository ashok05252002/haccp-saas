/**
 * Dashboard Service
 * Currently returns mock data. Replace with api.get('/dashboard') for Laravel.
 */
import { dashboardSummary, dailyLogCards, toolCards } from '../data/dashboardMockData';

export const getDashboardData = async () => {
  // Future: return api.get('/dashboard');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: dashboardSummary,
        dailyLogs: dailyLogCards,
        tools: toolCards,
      });
    }, 400);
  });
};
