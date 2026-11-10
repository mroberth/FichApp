import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configuración dinámica de red para FichApp.
 * 
 * En teléfonos físicos con Expo Go (en la misma red Wi-Fi):
 * - Extrae automáticamente la IP de la laptop desde la conexión de Metro (Constants.expoConfig.hostUri).
 * - O usa la IP Wi-Fi de tu laptop Fedora: 192.168.50.117.
 * 
 * En emulador Android: usa 10.0.2.2.
 * En Web / Local: usa localhost.
 */
const OBTENER_BASE_URL = () => {
  // 1. IP del servidor Metro de Expo (cuando se conecta desde Expo Go en celular)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  // 2. IP local de la laptop en la red Wi-Fi (Fedora 44)
  const IP_WIFI_LAPTOP = '192.168.50.117';

  // En dispositivos móviles (físicos o emuladores)
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return `http://${IP_WIFI_LAPTOP}:8000`;
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
  PLAYERS: '/api/v1/players',
  CATEGORIES: '/api/v1/categories',
  TEAMS: '/api/v1/teams',
  REPRESENTATIVES: '/api/v1/representatives',
  ATTENDANCE_SYNC: '/api/v1/attendance/sync',
  ATTENDANCE_SESSIONS: '/api/v1/attendance/sessions',
};
