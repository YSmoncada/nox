import axios from 'axios';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

// export const API_URL = "http://localhost:8000/api";
export const API_URL = "http://192.168.18.12:8000/api";
// export const API_URL = "https://mandala-proyect.onrender.com/api";
// export const API_URL = "http://172.20.10.2:8000/api"; // Tu IP de red local para MariaDB

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejo de expiración de token (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // No reintentar si es login o si ya falló un reintento anterior
      if (originalRequest.url.includes('/login') || originalRequest.url.includes('/token/refresh/')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Intentar obtener un nuevo access token
          const response = await axios.post(`${API_URL}/token/refresh/`, { 
            refresh: refreshToken 
          });
          
          const { token: access } = response.data;
          
          // Actualizar el store
          useAuthStore.getState().updateToken(access);
          
          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          // Si el refresh token también falló, cerramos sesión
          useAuthStore.getState().clearAuth();
          Alert.alert("Sesión Expirada", "Tu sesión ha expirado. Por favor ingresa de nuevo.");
          return Promise.reject(refreshError);
        }
      }
    }

    // Manejo de otros errores
    if (!error.response) {
      Alert.alert("Error de Conexión", "No se pudo contactar al servidor.");
    } else {
      const { status, data } = error.response;
      const message = data?.detail || data?.message || "Ocurrió un error inesperado";
      
      if (status === 401) {
        if (originalRequest.url.includes('/login')) {
          Alert.alert("Acceso Denegado", "El usuario o la clave no coinciden.");
        } else {
          Alert.alert("Sesión Expirada", "Vuelve a iniciar sesión.");
        }
      } else {
        Alert.alert(`Error ${status}`, message);
      }
    }
    console.log("API ERROR:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default apiClient;
