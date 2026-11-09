-- ============================================================================
-- Migración 002: Estructura Deportiva y Familias (Sprint 1)
-- Tablas: categorias, equipos, representantes, jugadores,
--         jugadores_representantes, asignaciones_jugadores_equipos,
--         asignaciones_entrenadores_equipos
-- Esquema: negocio
-- ============================================================================

-- ============================================================================
-- 1. CATEGORÍAS (Categorías por edad y modalidad en la academia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    modalidad VARCHAR(50) NOT NULL DEFAULT 'fútbol campo',
    edad_minima SMALLINT NULL,
    edad_maxima SMALLINT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_categoria_nombre_academia UNIQUE (academia_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_categorias_academia ON negocio.categorias(academia_id, estado);

-- ============================================================================
-- 2. EQUIPOS (Equipos o planteles dentro de una categoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES negocio.categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_equipo_nombre_categoria UNIQUE (academia_id, categoria_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_equipos_academia_categoria ON negocio.equipos(academia_id, categoria_id);

-- ============================================================================
-- 3. REPRESENTANTES (Padrón de padres / representantes legales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.representantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(30) NULL,
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(150) NULL,
    direccion TEXT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_representantes_academia_cedula ON negocio.representantes(academia_id, cedula);
CREATE INDEX IF NOT EXISTS idx_representantes_busqueda ON negocio.representantes(academia_id, apellidos, nombres);

-- ============================================================================
-- 4. JUGADORES (Ficha de atletas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NULL,
    cedula VARCHAR(30) NULL,
    sexo CHAR(1) NULL CHECK (sexo IN ('M', 'F')),
    ficha_medica JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'retirado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_jugadores_busqueda ON negocio.jugadores(academia_id, apellidos, nombres);
CREATE INDEX IF NOT EXISTS idx_jugadores_cedula ON negocio.jugadores(academia_id, cedula);
CREATE INDEX IF NOT EXISTS idx_jugadores_estado ON negocio.jugadores(academia_id, estado);

-- ============================================================================
-- 5. RELACIÓN JUGADORES - REPRESENTANTES (Parentesco N:M y contacto principal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.jugadores_representantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    jugador_id UUID NOT NULL REFERENCES negocio.jugadores(id) ON DELETE RESTRICT,
    representante_id UUID NOT NULL REFERENCES negocio.representantes(id) ON DELETE RESTRICT,
    tipo_relacion VARCHAR(50) NOT NULL DEFAULT 'representante_legal',
    es_contacto_principal BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_jugador_rep_academia UNIQUE (academia_id, jugador_id, representante_id)
);

CREATE INDEX IF NOT EXISTS idx_jugadores_rep_jugador ON negocio.jugadores_representantes(academia_id, jugador_id);
CREATE INDEX IF NOT EXISTS idx_jugadores_rep_rep ON negocio.jugadores_representantes(academia_id, representante_id);

-- ============================================================================
-- 6. ASIGNACIONES DE JUGADORES A EQUIPOS (Historial por temporada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.asignaciones_jugadores_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    jugador_id UUID NOT NULL REFERENCES negocio.jugadores(id) ON DELETE RESTRICT,
    equipo_id UUID NOT NULL REFERENCES negocio.equipos(id) ON DELETE RESTRICT,
    temporada VARCHAR(50) NOT NULL DEFAULT '2026',
    numero_camiseta SMALLINT NULL,
    posicion VARCHAR(50) NULL,
    vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
    vigente_hasta DATE NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_jugador_equipo_temporada UNIQUE (academia_id, jugador_id, equipo_id, temporada)
);

CREATE INDEX IF NOT EXISTS idx_asig_jug_equipos ON negocio.asignaciones_jugadores_equipos(academia_id, equipo_id, temporada);
CREATE INDEX IF NOT EXISTS idx_asig_jug_jugador ON negocio.asignaciones_jugadores_equipos(academia_id, jugador_id);

-- ============================================================================
-- 7. ASIGNACIONES DE ENTRENADORES A EQUIPOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS negocio.asignaciones_entrenadores_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES negocio.academias(id) ON DELETE RESTRICT,
    entrenador_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE RESTRICT,
    equipo_id UUID NOT NULL REFERENCES negocio.equipos(id) ON DELETE RESTRICT,
    rol_en_equipo VARCHAR(50) NOT NULL DEFAULT 'principal' CHECK (rol_en_equipo IN ('principal', 'asistente', 'preparador_fisico')),
    vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
    vigente_hasta DATE NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_entrenador_equipo_vigente UNIQUE (academia_id, entrenador_id, equipo_id, vigente_desde)
);

CREATE INDEX IF NOT EXISTS idx_asig_entrenador_equipo ON negocio.asignaciones_entrenadores_equipos(academia_id, equipo_id);
CREATE INDEX IF NOT EXISTS idx_asig_entrenador_usuario ON negocio.asignaciones_entrenadores_equipos(academia_id, entrenador_id);
