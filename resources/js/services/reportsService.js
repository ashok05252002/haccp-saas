/**
 * Reports Service
 * Currently returns mock data. Replace with api calls for Laravel.
 */
import { reportsMockData } from '../data/reportsMockData';

export const getReportData = async (date, moduleFilter) => {
  // Future: return api.get('/haccp/reports', { params: { date, module: moduleFilter } });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(reportsMockData);
    }, 400);
  });
};

export const exportReportCSV = async (date) => {
  // Future: return api.get('/haccp/reports/export', { params: { date }, responseType: 'blob' });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'CSV export will be connected to backend later.' });
    }, 300);
  });
};
