-- ============================================================================
-- Migración 001: Esquemas y Tablas Maestras Base (Tenants, Seguridad y Auditoría)
-- Sistema: FichApp (Gestor de Academias Deportivas)
-- Base de Datos: PostgreSQL 16+
-- ============================================================================

-- Extensiones para generación de UUIDs nativos y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREACIÓN DE ESQUEMAS SEPARADOS
-- ============================================================================
-- Esquema para la lógica administrativa, deportiva y financiera de las academias
CREATE SCHEMA IF NOT EXISTS negocio;

-- Esquema para cuentas de usuario, autenticación, tokens de sesión y bitácoras
CREATE SCHEMA IF NOT EXISTS seguridad;

-- ============================================================================
-- 2. ESQUEMA NEGOCIO: ACADEMIAS (TENANTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.academias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    rif VARCHAR(30) NULL,
    telefono VARCHAR(30) NULL,
    correo VARCHAR(150) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'inactivo')),
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Caracas',
    configuracion JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academias_estado ON negocio.academias(estado);

-- ============================================================================
-- 3. ESQUEMA SEGURIDAD: USUARIOS Y AUTENTICACIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS seguridad.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    identificador_acceso VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NULL,
    telefono VARCHAR(30) NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('superadmin', 'administrador', 'entrenador')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_acceso_academia UNIQUE (academia_id, identificador_acceso)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_academia_rol ON seguridad.usuarios(academia_id, rol, estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_acceso ON seguridad.usuarios(identificador_acceso);

-- ============================================================================
-- 4. ESQUEMA SEGURIDAD: SESIONES Y TOKENS BEARER
-- ============================================================================
CREATE TABLE IF NOT EXISTS seguridad.sesiones_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 del token para no guardar texto plano
    ip_origen VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    revocado_en TIMESTAMPTZ NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token_hash ON seguridad.sesiones_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_expira ON seguridad.sesiones_tokens(usuario_id, expira_en);

-- ============================================================================
-- 5. ESQUEMA SEGURIDAD: AUDITORÍA Y TRAZABILIDAD
-- ============================================================================
CREATE TABLE IF NOT EXISTS seguridad.registros_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    usuario_id UUID NULL REFERENCES seguridad.usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    tipo_entidad VARCHAR(50) NOT NULL,
    entidad_id UUID NOT NULL,
    metadatos JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_academia_entidad ON seguridad.registros_auditoria(academia_id, tipo_entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON seguridad.registros_auditoria(academia_id, creado_en DESC);
