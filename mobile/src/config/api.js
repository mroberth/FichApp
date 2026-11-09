import { Platform } from 'react-native';

/**
 * Configuración de red para el backend de FichApp.
 * 
 * - Emulador Android: usa 'http://10.0.2.2:8000' (apunta al localhost de la laptop).
 * - Navegador Web / Simulador iOS: usa 'http://localhost:8000'.
 * - Teléfono físico con Expo Go: Si estás en la misma red Wi-Fi, puedes colocar
 *   la IP local de tu laptop en IP_SERVIDOR_MANUAL (ej: '192.168.1.100').
 */
const IP_SERVIDOR_MANUAL = null;

const OBTENER_BASE_URL = () => {
  if (IP_SERVIDOR_MANUAL) {
    return `http://${IP_SERVIDOR_MANUAL}:8000`;
  }
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
