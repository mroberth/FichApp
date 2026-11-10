import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { generarUUID } from '../utils/uuid';

const NOMBRE_BD = 'fichapp_cancha.db';
let dbInstancia = null;

// En memoria para entornos donde SQLite nativo no esté listo o en testing
const memoriaStorage = {
  sesiones: [],
  registros: [],
  plantillas: [],
  equipos: [],
};

/**
 * Abre o reutiliza la conexión con SQLite local.
 */
export const obtenerBaseDatos = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!dbInstancia) {
    dbInstancia = await SQLite.openDatabaseAsync(NOMBRE_BD);
  }
  return dbInstancia;
};

/**
 * Inicializa el esquema de tablas locales en SQLite.
 */
export const inicializarBaseDatosLocal = async () => {
  const db = await obtenerBaseDatos();
  if (!db) return;

  // Habilitar claves foráneas y WAL para rendimiento
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    -- 1. Tabla de Sesiones de Asistencia Local
    CREATE TABLE IF NOT EXISTS sesiones_local (
      id TEXT PRIMARY KEY NOT NULL,
      academia_id TEXT NOT NULL,
      equipo_id TEXT NOT NULL,
      equipo_nombre TEXT,
      categoria_nombre TEXT,
      fecha_sesion TEXT NOT NULL,
      lugar TEXT,
      observaciones TEXT,
      creado_por TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0, -- 0: pendiente, 1: sincronizado en backend
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. Tabla de Registros Individuales de Asistencia Local
    CREATE TABLE IF NOT EXISTS registros_asistencia_local (
      id TEXT PRIMARY KEY NOT NULL,
      academia_id TEXT NOT NULL,
      sesion_id TEXT NOT NULL,
      jugador_id TEXT NOT NULL,
      jugador_nombre TEXT NOT NULL,
      numero_camiseta INTEGER,
      estado_asistencia TEXT NOT NULL CHECK (estado_asistencia IN ('presente', 'ausente', 'justificado')),
      observaciones TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sesion_id) REFERENCES sesiones_local (id) ON DELETE CASCADE,
      UNIQUE(sesion_id, jugador_id)
    );

    -- 3. Tabla de Caché de Plantillas de Jugadores por Equipo (para pasar asistencia 100% offline)
    CREATE TABLE IF NOT EXISTS cache_plantillas_jugadores (
      id TEXT PRIMARY KEY NOT NULL,
      academia_id TEXT NOT NULL,
      equipo_id TEXT NOT NULL,
      jugador_id TEXT NOT NULL,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      numero_camiseta INTEGER,
      posicion TEXT,
      estado_atleta TEXT NOT NULL DEFAULT 'activo',
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(equipo_id, jugador_id)
    );

    -- 4. Tabla de Caché de Equipos (para seleccionar equipo 100% offline)
    CREATE TABLE IF NOT EXISTS cache_equipos (
      id TEXT PRIMARY KEY NOT NULL,
      academia_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      categoria_nombre TEXT,
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sesiones_sincronizado ON sesiones_local(sincronizado, fecha_sesion DESC);
    CREATE INDEX IF NOT EXISTS idx_registros_sesion ON registros_asistencia_local(sesion_id);
    CREATE INDEX IF NOT EXISTS idx_cache_equipo ON cache_plantillas_jugadores(equipo_id);
  `);
};

export const asistenciaOfflineRepository = {
  /**
   * Guarda o actualiza en caché la lista de equipos.
   */
  async cachearEquipos(academiaId, equipos) {
    const db = await obtenerBaseDatos();
    if (!db) {
      memoriaStorage.equipos = equipos;
      return;
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM cache_equipos');
      for (const eq of equipos) {
        await db.runAsync(
          `INSERT INTO cache_equipos (id, academia_id, nombre, categoria_nombre) VALUES (?, ?, ?, ?)`,
          [eq.id, academiaId, eq.nombre, eq.categoria_nombre || '']
        );
      }
    });
  },

  /**
   * Obtiene la lista de equipos desde el caché local de SQLite.
   */
  async obtenerEquiposLocales() {
    const db = await obtenerBaseDatos();
    if (!db) {
      return memoriaStorage.equipos || [];
    }

    return await db.getAllAsync('SELECT * FROM cache_equipos ORDER BY nombre ASC');
  },

  /**
   * Guarda o actualiza en caché la plantilla de atletas de un equipo.
   */
  async cachearPlantilla(academiaId, equipoId, jugadores) {
    const db = await obtenerBaseDatos();
    if (!db) {
      memoriaStorage.plantillas = memoriaStorage.plantillas.filter((p) => p.equipo_id !== equipoId);
      for (const j of jugadores) {
        memoriaStorage.plantillas.push({
          id: generarUUID(),
          academia_id: academiaId,
          equipo_id: equipoId,
          jugador_id: j.id,
          nombres: j.nombres,
          apellidos: j.apellidos,
          numero_camiseta: j.numero_camiseta || null,
          posicion: j.posicion || null,
        });
      }
      return;
    }

    await db.withTransactionAsync(async () => {
      // Limpiar plantilla previa de este equipo
      await db.runAsync('DELETE FROM cache_plantillas_jugadores WHERE equipo_id = ?', [equipoId]);

      for (const j of jugadores) {
        const id = generarUUID();
        const idAtleta = j.jugador_id || j.id;
        await db.runAsync(
          `INSERT INTO cache_plantillas_jugadores (
            id, academia_id, equipo_id, jugador_id, nombres, apellidos, numero_camiseta, posicion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            academiaId,
            equipoId,
            idAtleta,
            j.nombres || '',
            j.apellidos || '',
            j.numero_camiseta || null,
            j.posicion || null,
          ]
        );
      }
    });
  },

  /**
   * Obtiene la lista de atletas cacheados de un equipo para pasar asistencia offline.
   */
  async obtenerPlantillaLocal(equipoId) {
    const db = await obtenerBaseDatos();
    if (!db) {
      return memoriaStorage.plantillas.filter((p) => p.equipo_id === equipoId);
    }

    return await db.getAllAsync(
      `SELECT * FROM cache_plantillas_jugadores WHERE equipo_id = ? ORDER BY apellidos ASC, nombres ASC`,
      [equipoId]
    );
  },

  /**
   * Guarda una nueva sesión de entrenamiento y todos sus registros de asistencia en SQLite.
   */
  async guardarSesionConAsistencias({
    id = null,
    academiaId,
    equipoId,
    equipoNombre = '',
    categoriaNombre = '',
    fechaSesion,
    lugar = '',
    observaciones = '',
    creadoPor,
    registros = [], // [{ jugador_id, jugador_nombre, numero_camiseta, estado_asistencia, observaciones }]
  }) {
    const sesionId = id || generarUUID();
    const db = await obtenerBaseDatos();

    if (!db) {
      const sesionMemoria = {
        id: sesionId,
        academia_id: academiaId,
        equipo_id: equipoId,
        equipo_nombre: equipoNombre,
        categoria_nombre: categoriaNombre,
        fecha_sesion: fechaSesion,
        lugar,
        observaciones,
        creado_por: creadoPor,
        sincronizado: 0,
        creado_en: new Date().toISOString(),
      };
      memoriaStorage.sesiones.push(sesionMemoria);

      for (const reg of registros) {
        memoriaStorage.registros.push({
          id: generarUUID(),
          academia_id: academiaId,
          sesion_id: sesionId,
          jugador_id: reg.jugador_id,
          jugador_nombre: reg.jugador_nombre,
          numero_camiseta: reg.numero_camiseta || null,
          estado_asistencia: reg.estado_asistencia,
          observaciones: reg.observaciones || '',
          sincronizado: 0,
        });
      }
      return sesionId;
    }

    await db.withTransactionAsync(async () => {
      // 1. Insertar Sesión
      await db.runAsync(
        `INSERT INTO sesiones_local (
          id, academia_id, equipo_id, equipo_nombre, categoria_nombre, fecha_sesion, lugar, observaciones, creado_por, sincronizado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          sesionId,
          academiaId,
          equipoId,
          equipoNombre,
          categoriaNombre,
          fechaSesion,
          lugar,
          observaciones,
          creadoPor,
        ]
      );

      // 2. Insertar Registros de Asistencia
      for (const reg of registros) {
        const registroId = generarUUID();
        await db.runAsync(
          `INSERT INTO registros_asistencia_local (
            id, academia_id, sesion_id, jugador_id, jugador_nombre, numero_camiseta, estado_asistencia, observaciones, sincronizado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            registroId,
            academiaId,
            sesionId,
            reg.jugador_id,
            reg.jugador_nombre,
            reg.numero_camiseta || null,
            reg.estado_asistencia,
            reg.observaciones || '',
          ]
        );
      }
    });

    return sesionId;
  },

  /**
   * Obtiene las sesiones locales con conteos de asistencia.
   */
  async listarSesionesLocales(limite = 50) {
    const db = await obtenerBaseDatos();
    if (!db) {
      return memoriaStorage.sesiones.map((s) => {
        const regs = memoriaStorage.registros.filter((r) => r.sesion_id === s.id);
        return {
          ...s,
          total_atletas: regs.length,
          presentes: regs.filter((r) => r.estado_asistencia === 'presente').length,
          ausentes: regs.filter((r) => r.estado_asistencia === 'ausente').length,
          justificados: regs.filter((r) => r.estado_asistencia === 'justificado').length,
        };
      });
    }

    return await db.getAllAsync(
      `SELECT s.*, 
              COUNT(r.id) as total_atletas,
              SUM(CASE WHEN r.estado_asistencia = 'presente' THEN 1 ELSE 0 END) as presentes,
              SUM(CASE WHEN r.estado_asistencia = 'ausente' THEN 1 ELSE 0 END) as ausentes,
              SUM(CASE WHEN r.estado_asistencia = 'justificado' THEN 1 ELSE 0 END) as justificados
       FROM sesiones_local s
       LEFT JOIN registros_asistencia_local r ON s.id = r.sesion_id
       GROUP BY s.id
       ORDER BY s.fecha_sesion DESC
       LIMIT ?`,
      [limite]
    );
  },

  /**
   * Obtiene todas las sesiones y registros pendientes por sincronizar con el backend.
   */
  async obtenerPendientesSincronizacion() {
    const db = await obtenerBaseDatos();
    if (!db) {
      const sesionesPendientes = memoriaStorage.sesiones.filter((s) => s.sincronizado === 0);
      const registrosPendientes = memoriaStorage.registros.filter((r) => r.sincronizado === 0);
      return { sesiones: sesionesPendientes, registros: registrosPendientes };
    }

    const sesiones = await db.getAllAsync('SELECT * FROM sesiones_local WHERE sincronizado = 0');
    const registros = await db.getAllAsync('SELECT * FROM registros_asistencia_local WHERE sincronizado = 0');

    return { sesiones, registros };
  },

  /**
   * Marca sesiones y registros como sincronizados tras respuesta exitosa del backend.
   */
  async marcarComoSincronizados(sesionIds = [], registroIds = []) {
    const db = await obtenerBaseDatos();
    if (!db) {
      memoriaStorage.sesiones.forEach((s) => {
        if (sesionIds.includes(s.id)) s.sincronizado = 1;
      });
      memoriaStorage.registros.forEach((r) => {
        if (registroIds.includes(r.id) || sesionIds.includes(r.sesion_id)) r.sincronizado = 1;
      });
      return;
    }

    await db.withTransactionAsync(async () => {
      for (const sId of sesionIds) {
        await db.runAsync('UPDATE sesiones_local SET sincronizado = 1 WHERE id = ?', [sId]);
        await db.runAsync('UPDATE registros_asistencia_local SET sincronizado = 1 WHERE sesion_id = ?', [sId]);
      }
      for (const rId of registroIds) {
        await db.runAsync('UPDATE registros_asistencia_local SET sincronizado = 1 WHERE id = ?', [rId]);
      }
    });
  },

  /**
   * Cuenta cuántas sesiones están pendientes de subida.
   */
  async contarPendientes() {
    const db = await obtenerBaseDatos();
    if (!db) {
      return memoriaStorage.sesiones.filter((s) => s.sincronizado === 0).length;
    }

    const res = await db.getFirstAsync('SELECT COUNT(*) as total FROM sesiones_local WHERE sincronizado = 0');
    return res ? res.total : 0;
  },
};
