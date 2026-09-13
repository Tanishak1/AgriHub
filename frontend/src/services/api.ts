import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto inject JWT token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrihub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Auth Services
export const authAPI = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (userData: any) => api.post('/auth/signup', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData: any) => api.put('/auth/me', profileData),
};

// Device Services
export const deviceAPI = {
  getDevices: () => api.get('/devices'),
  addDevice: (deviceData: any) => api.post('/devices', deviceData),
  deleteDevice: (id: string) => api.delete(`/devices/${id}`),
  getDiagnostics: (id: string) => api.get(`/devices/${id}/diagnostics`),
  getSimulatorConfig: () => api.get('/devices/simulator'),
  updateSimulatorConfig: (simData: any) => api.post('/devices/simulator', simData),
  pairDevice: () => api.post('/devices/simulator/pair'),
};

// Sensor Services
export const sensorAPI = {
  getSensors: () => api.get('/sensors'),
  getSensorDetail: (id: string) => api.get(`/sensors/${id}`),
  getSensorReadings: (id: string, range: string) => api.get(`/sensors/${id}/readings?range=${range}`),
  updateThresholds: (id: string, config: any) => api.put(`/sensors/${id}`, config),
};

// Farm & Crop Services
export const cropAPI = {
  getFarms: () => api.get('/crops/farms'),
  createFarm: (farmData: any) => api.post('/crops/farms', farmData),
  createField: (fieldData: any) => api.post('/crops/fields', fieldData),
  harvestCropCycle: (id: string, statusData: any) => api.post(`/crops/cropcycle/${id}/harvest`, statusData),
};

// Alert & Notification Services
export const alertAPI = {
  getAlerts: () => api.get('/alerts'),
  markAlertRead: (id: string) => api.put(`/alerts/${id}/read`),
  getNotifications: () => api.get('/alerts/notifications'),
  markNotificationRead: (id: string) => api.put(`/alerts/notifications/${id}/read`),
  clearNotifications: () => api.delete('/alerts/notifications'),
};

// AI & Recommendation Services
export const aiAPI = {
  getRecommendation: () => api.get('/ai/recommend'),
  askChat: (question: string) => api.post('/ai/chat', { question }),
};
