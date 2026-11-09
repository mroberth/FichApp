<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ExcepcionApi;
use App\Repositories\CategoriaRepository;
use App\Repositories\EquipoRepository;
use App\Repositories\UsuarioRepository;
use App\Repositories\AuditoriaRepository;

/**
 * Servicio de dominio para la gestión de categorías, planteles de equipos
 * y asignación técnica de entrenadores.
 */
class EstructuraDeportivaService
{
    private CategoriaRepository $categoriaRepo;
    private EquipoRepository $equipoRepo;
    private UsuarioRepository $usuarioRepo;
    private AuditoriaRepository $auditoriaRepo;

    public function __construct(
        ?CategoriaRepository $categoriaRepo = null,
        ?EquipoRepository $equipoRepo = null,
        ?UsuarioRepository $usuarioRepo = null,
        ?AuditoriaRepository $auditoriaRepo = null
    ) {
        $this->categoriaRepo = $categoriaRepo ?? new CategoriaRepository();
        $this->equipoRepo    = $equipoRepo ?? new EquipoRepository();
        $this->usuarioRepo   = $usuarioRepo ?? new UsuarioRepository();
        $this->auditoriaRepo = $auditoriaRepo ?? new AuditoriaRepository();
    }

    /**
     * Lista las categorías de una academia.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarCategorias(string $academiaId, ?string $estado = null): array
    {
        return $this->categoriaRepo->listarPorAcademia($academiaId, $estado);
    }

    /**
     * Crea una nueva categoría validando que el nombre no esté duplicado en la academia.
     *
     * @param array<string, mixed> $datos
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function crearCategoria(string $academiaId, array $datos, ?string $usuarioId = null): array
    {
        $nombre = trim((string)($datos['nombre'] ?? ''));
        if ($nombre === '') {
            throw ExcepcionApi::validacion('El nombre de la categoría es obligatorio.');
        }

        $existente = $this->categoriaRepo->buscarPorNombre($nombre, $academiaId);
        if ($existente !== null) {
            throw ExcepcionApi::validacion("Ya existe una categoría denominada '{$nombre}' en esta academia.");
        }

        $id = $this->categoriaRepo->crear($academiaId, $datos);

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'CREAR_CATEGORIA',
            'negocio.categorias',
            $id,
            ['nombre' => $nombre]
        );

        $cat = $this->categoriaRepo->buscarPorId($id, $academiaId);
        if ($cat === null) {
            throw ExcepcionApi::servidor('Error al recuperar categoría creada.');
        }

        return $cat;
    }

    /**
     * Lista los equipos de una academia con filtro opcional de categoría.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarEquipos(string $academiaId, ?string $categoriaId = null, ?string $estado = null): array
    {
        return $this->equipoRepo->listarPorAcademia($academiaId, $categoriaId, $estado);
    }

    /**
     * Crea un equipo deportivo validando que la categoría exista y el nombre sea único en ella.
     *
     * @param array<string, mixed> $datos
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function crearEquipo(string $academiaId, array $datos, ?string $usuarioId = null): array
    {
        $nombre = trim((string)($datos['nombre'] ?? ''));
        if ($nombre === '') {
            throw ExcepcionApi::validacion('El nombre del equipo es obligatorio.');
        }

        $categoriaId = trim((string)($datos['categoria_id'] ?? ''));
        if ($categoriaId === '') {
            throw ExcepcionApi::validacion('La categoría es obligatoria para crear un equipo.');
        }

        $cat = $this->categoriaRepo->buscarPorId($categoriaId, $academiaId);
        if ($cat === null) {
            throw ExcepcionApi::noEncontrado('La categoría deportiva indicada no existe.');
        }

        $existente = $this->equipoRepo->buscarPorNombreYCategoria($nombre, $categoriaId, $academiaId);
        if ($existente !== null) {
            throw ExcepcionApi::validacion("Ya existe un equipo llamado '{$nombre}' en la categoría seleccionada.");
        }

        $id = $this->equipoRepo->crear($academiaId, $datos);

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'CREAR_EQUIPO',
            'negocio.equipos',
            $id,
            ['nombre' => $nombre, 'categoria_id' => $categoriaId]
        );

        $equipo = $this->equipoRepo->buscarPorId($id, $academiaId);
        if ($equipo === null) {
            throw ExcepcionApi::servidor('Error al recuperar equipo creado.');
        }

        return $equipo;
    }

    /**
     * Asigna un entrenador a un equipo deportivo validando que el usuario tenga rol de entrenador.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function asignarEntrenador(
        string $academiaId,
        string $equipoId,
        string $entrenadorId,
        string $rol = 'principal',
        ?string $usuarioId = null
    ): array {
        $equipo = $this->equipoRepo->buscarPorId($equipoId, $academiaId);
        if ($equipo === null) {
            throw ExcepcionApi::noEncontrado('Equipo no encontrado en esta academia.');
        }

        $entrenador = $this->usuarioRepo->buscarPorId($entrenadorId);
        if ($entrenador === null || $entrenador['academia_id'] !== $academiaId) {
            throw ExcepcionApi::noEncontrado('El entrenador no pertenece a esta academia.');
        }

        if ($entrenador['rol'] !== 'entrenador' && $entrenador['rol'] !== 'administrador') {
            throw ExcepcionApi::validacion('El usuario seleccionado no posee permisos técnicos de entrenador.');
        }

        $asignacionId = $this->equipoRepo->asignarEntrenador(
            $academiaId,
            $entrenadorId,
            $equipoId,
            $rol
        );

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'ASIGNAR_ENTRENADOR_EQUIPO',
            'negocio.asignaciones_entrenadores_equipos',
            $asignacionId,
            [
                'equipo_id'     => $equipoId,
                'entrenador_id' => $entrenadorId,
                'rol'           => $rol,
            ]
        );

        return [
            'asignacion_id'      => $asignacionId,
            'equipo_id'          => $equipoId,
            'equipo_nombre'      => $equipo['nombre'],
            'entrenador_id'      => $entrenadorId,
            'entrenador_nombre'  => $entrenador['nombre'],
            'rol_en_equipo'      => $rol,
        ];
    }

    /**
     * Obtiene los entrenadores asignados a un equipo.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerEntrenadoresDeEquipo(string $equipoId, string $academiaId): array
    {
        return $this->equipoRepo->obtenerEntrenadores($equipoId, $academiaId);
    }
}
