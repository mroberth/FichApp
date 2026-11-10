import { API_BASE_URL, ENDPOINTS } from '../config/api';

let manejadorNoAutorizado = null;

/**
 * Registra un callback global para interceptar respuestas 401 (desautenticación reactiva).
 * @param {Function} callback Función a ejecutar cuando el backend retorna 401 (ej. limpiar sesión y redirigir).
 */
export const registrarManejadorNoAutorizado = (callback) => {
  manejadorNoAutorizado = callback;
};

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

  // Timeout preventivo de 8 segundos para evitar spinners infinitos
  const controlador = new AbortController();
  const temporizador = setTimeout(() => {
    controlador.abort();
  }, 8000);

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      headers: cabeceras,
      signal: controlador.signal,
    });
    clearTimeout(temporizador);

    const texto = await respuesta.text();
    let json = null;

    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      throw new Error(`Respuesta no esperada del servidor (${respuesta.status})`);
    }

    if (!respuesta.ok || (json && json.exito === false)) {
      const mensaje = json?.error?.mensaje || `Error en la solicitud (${respuesta.status})`;
      const error = new Error(mensaje);
      error.codigo = json?.error?.codigo || 'HTTP_ERROR';
      error.estado = json?.error?.estado || respuesta.status;
      error.detalles = json?.error?.detalles || null;

      // Interceptor 401: Token expirado o revocado en base de datos
      // Dispara la desautenticación automática solo en peticiones autenticadas (evita loop en /login)
      if (error.estado === 401 && ruta !== ENDPOINTS.LOGIN && typeof manejadorNoAutorizado === 'function') {
        try {
          manejadorNoAutorizado(error);
        } catch (errCallback) {
          console.warn('Error en callback no autorizado:', errCallback);
        }
      }

      throw error;
    }

    return json?.datos;
  } catch (err) {
    clearTimeout(temporizador);

    if (err.name === 'AbortError') {
      const errorTimeout = new Error(`Tiempo de espera agotado (8s). No se pudo conectar a ${url}. Verifica que la laptop y el celular estén en el mismo Wi-Fi.`);
      errorTimeout.codigo = 'TIMEOUT';
      errorTimeout.estado = 0;
      throw errorTimeout;
    }

    if (err.message && err.message.includes('Network request failed')) {
      const errorRed = new Error(`No se pudo conectar a ${url}. Verifica que el backend PHP esté corriendo en tu laptop.`);
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

  /**
   * Lista los jugadores aplicando filtros y paginación.
   */
  async listarJugadores(token, filtros = {}) {
    const partes = [];
    if (filtros.busqueda) partes.push(`busqueda=${encodeURIComponent(filtros.busqueda)}`);
    if (filtros.categoria_id) partes.push(`categoria_id=${encodeURIComponent(filtros.categoria_id)}`);
    if (filtros.equipo_id) partes.push(`equipo_id=${encodeURIComponent(filtros.equipo_id)}`);
    if (filtros.limite) partes.push(`limite=${encodeURIComponent(filtros.limite)}`);
    if (filtros.offset) partes.push(`offset=${encodeURIComponent(filtros.offset)}`);

    const queryString = partes.length > 0 ? `?${partes.join('&')}` : '';
    return await solicitar(`${ENDPOINTS.PLAYERS}${queryString}`, {
      method: 'GET',
    }, token);
  },

  /**
   * Obtiene la ficha deportiva consolidada completa de un atleta por su UUID.
   */
  async obtenerFichaJugador(token, id) {
    return await solicitar(`${ENDPOINTS.PLAYERS}/${id}`, {
      method: 'GET',
    }, token);
  },

  /**
   * Registra un nuevo jugador con su representante y equipo opcional.
   */
  async registrarJugador(token, datos) {
    return await solicitar(ENDPOINTS.PLAYERS, {
      method: 'POST',
      body: JSON.stringify(datos),
    }, token);
  },

  /**
   * Asigna un jugador a un equipo deportivo en una temporada.
   */
  async asignarEquipo(token, jugadorId, datos) {
    return await solicitar(`${ENDPOINTS.PLAYERS}/${jugadorId}/team`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }, token);
  },

  /**
   * Actualiza los datos de un jugador existente.
   */
  async actualizarJugador(token, jugadorId, datos) {
    return await solicitar(`${ENDPOINTS.PLAYERS}/${jugadorId}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }, token);
  },

  /**
   * Da de baja lógica a un jugador de la academia.
   */
  async eliminarJugador(token, jugadorId) {
    return await solicitar(`${ENDPOINTS.PLAYERS}/${jugadorId}`, {
      method: 'DELETE',
    }, token);
  },

  /**
   * Lista las categorías deportivas de la academia.
   */
  async listarCategorias(token) {
    return await solicitar(ENDPOINTS.CATEGORIES, {
      method: 'GET',
    }, token);
  },

  /**
   * Lista los equipos deportivos de la academia.
   */
  async listarEquipos(token, categoriaId = null) {
    const query = categoriaId ? `?categoria_id=${encodeURIComponent(categoriaId)}` : '';
    return await solicitar(`${ENDPOINTS.TEAMS}${query}`, {
      method: 'GET',
    }, token);
  },
};
