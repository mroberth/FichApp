import { API_BASE_URL, ENDPOINTS } from '../config/api';

/**
 * Realiza una petición HTTP contra el backend de FichApp y procesa
 * las respuestas de acuerdo al contrato estándar JSON en español.
 */
const solicitar = async (ruta, opciones = {}, token = null) => {
  const url = `${API_BASE_URL}${ruta}`;

  const cabeceras = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(opciones.headers || {}),
  };

  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      headers: cabeceras,
    });

    const texto = await respuesta.text();
    let json = null;

    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      throw new Error(`Respuesta del servidor no es JSON: ${texto.substring(0, 100)}`);
    }

    if (!respuesta.ok || (json && json.exito === false)) {
      const mensaje = json?.error?.mensaje || `Error en la solicitud HTTP (${respuesta.status})`;
      const error = new Error(mensaje);
      error.codigo = json?.error?.codigo || 'HTTP_ERROR';
      error.estado = json?.error?.estado || respuesta.status;
      error.detalles = json?.error?.detalles || null;
      throw error;
    }

    return json?.datos;
  } catch (err) {
    if (err.message && err.message.includes('Network request failed')) {
      const errorRed = new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000.');
      errorRed.codigo = 'NETWORK_ERROR';
      errorRed.estado = 0;
      throw errorRed;
    }
    throw err;
  }
};

export const apiService = {
  /**
   * Autentica con identificador de acceso y contraseña.
   */
  async login(identificadorAcceso, contrasena) {
    return await solicitar(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        identificador_acceso: identificadorAcceso,
        contrasena: contrasena,
      }),
    });
  },

  /**
   * Obtiene el perfil del usuario autenticado con su academia y permisos.
   */
  async obtenerPerfil(token) {
    return await solicitar(ENDPOINTS.ME, {
      method: 'GET',
    }, token);
  },

  /**
   * Cierra la sesión activa revocando el token en el servidor.
   */
  async logout(token) {
    return await solicitar(ENDPOINTS.LOGOUT, {
      method: 'POST',
    }, token);
  },

  /**
   * Verifica la conectividad con el backend.
   */
  async ping() {
    return await solicitar(ENDPOINTS.PING, {
      method: 'GET',
    });
  },
};
