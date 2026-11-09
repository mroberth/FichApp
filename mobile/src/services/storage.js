import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE_TOKEN = 'fichapp_bearer_token';
const CLAVE_USUARIO = 'fichapp_usuario_cache';

// Fallback en memoria si la plataforma no soporta SecureStore (ej: testing o web)
const almacenamientoEnMemoria = new Map();

const esSecureStoreDisponible = async () => {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const guardarToken = async (token) => {
  try {
    if (await esSecureStoreDisponible()) {
      await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    } else {
      almacenamientoEnMemoria.set(CLAVE_TOKEN, token);
    }
  } catch (error) {
    console.error('Error guardando token seguro:', error);
  }
};

export const obtenerToken = async () => {
  try {
    if (await esSecureStoreDisponible()) {
      return await SecureStore.getItemAsync(CLAVE_TOKEN);
    }
    return almacenamientoEnMemoria.get(CLAVE_TOKEN) || null;
  } catch (error) {
    console.error('Error obteniendo token seguro:', error);
    return null;
  }
};

export const eliminarToken = async () => {
  try {
    if (await esSecureStoreDisponible()) {
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    } else {
      almacenamientoEnMemoria.delete(CLAVE_TOKEN);
    }
  } catch (error) {
    console.error('Error eliminando token seguro:', error);
  }
};

export const guardarUsuario = async (usuario) => {
  try {
    const json = JSON.stringify(usuario);
    if (await esSecureStoreDisponible()) {
      await SecureStore.setItemAsync(CLAVE_USUARIO, json);
    } else {
      almacenamientoEnMemoria.set(CLAVE_USUARIO, json);
    }
  } catch (error) {
    console.error('Error guardando usuario en caché:', error);
  }
};

export const obtenerUsuario = async () => {
  try {
    let json = null;
    if (await esSecureStoreDisponible()) {
      json = await SecureStore.getItemAsync(CLAVE_USUARIO);
    } else {
      json = almacenamientoEnMemoria.get(CLAVE_USUARIO) || null;
    }
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Error recuperando usuario en caché:', error);
    return null;
  }
};

export const limpiarTodo = async () => {
  await eliminarToken();
  try {
    if (await esSecureStoreDisponible()) {
      await SecureStore.deleteItemAsync(CLAVE_USUARIO);
    } else {
      almacenamientoEnMemoria.delete(CLAVE_USUARIO);
    }
  } catch (error) {
    console.error('Error limpiando almacenamiento:', error);
  }
};
