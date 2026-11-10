-- ============================================================================
-- MIGRACIÓN 003: MÓDULO DE ASISTENCIA TÉCNICA EN CANCHA (OFFLINE-FIRST)
-- Tarea: [T2.1] Migraciones Backend: Sesiones y Registros de Asistencia
-- Esquema objetivo: negocio
-- ============================================================================

-- 1. Tabla de Sesiones de Entrenamiento / Partidos
-- Nota: id acepta UUIDv4 generado desde SQLite local en el móvil o autogenerado por PostgreSQL
CREATE TABLE IF NOT EXISTS negocio.sesiones_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    equipo_id UUID NOT NULL REFERENCES negocio.equipos(id) ON DELETE RESTRICT,
    fecha_sesion TIMESTAMPTZ NOT NULL,
    lugar VARCHAR(150) NULL,
    observaciones TEXT NULL,
    creado_por UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE RESTRICT,
    sincronizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda eficiente para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_equipo_fecha 
    ON negocio.sesiones_asistencia(academia_id, equipo_id, fecha_sesion DESC);

CREATE INDEX IF NOT EXISTS idx_sesiones_creado_por 
    ON negocio.sesiones_asistencia(academia_id, creado_por);

-- 2. Tabla de Registros Individuales de Asistencia por Jugador
CREATE TABLE IF NOT EXISTS negocio.registros_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    sesion_id UUID NOT NULL REFERENCES negocio.sesiones_asistencia(id) ON DELETE CASCADE,
    jugador_id UUID NOT NULL REFERENCES negocio.jugadores(id) ON DELETE RESTRICT,
    estado_asistencia VARCHAR(20) NOT NULL CHECK (estado_asistencia IN ('presente', 'ausente', 'justificado')),
    observaciones TEXT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asistencia_jugador_sesion UNIQUE (sesion_id, jugador_id)
);

-- Índices de consulta rápida de asistencia por sesión y por jugador
CREATE INDEX IF NOT EXISTS idx_asistencia_sesion 
    ON negocio.registros_asistencia(sesion_id);

CREATE INDEX IF NOT EXISTS idx_asistencia_jugador 
    ON negocio.registros_asistencia(academia_id, jugador_id);
