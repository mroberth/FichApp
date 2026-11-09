import { Platform } from 'react-native';

/**
 * Configuración de red para el backend de FichApp.
 * 
 * - En emulador Android, 10.0.2.2 apunta a localhost de la máquina anfitriona.
 * - En iOS / Web / Dispositivos físicos con reverse proxy, usa localhost o la IP de tu red local.
 */
const OBTENER_BASE_URL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = OBTENER_BASE_URL();

export const ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  ME: '/api/v1/auth/me',
  LOGOUT: '/api/v1/auth/logout',
  PING: '/api/v1/ping',
  ESTADO: '/api/v1/estado',
};
