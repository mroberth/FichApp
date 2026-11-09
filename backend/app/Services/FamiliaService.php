<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\ExcepcionApi;
use App\DTOs\CrearRepresentanteDTO;
use App\Repositories\RepresentanteRepository;
use App\Repositories\JugadorRepository;
use App\Repositories\AuditoriaRepository;

/**
 * Servicio de dominio para el padrón de familias, tutela de representantes
 * y gestión de grupos familiares multihijo.
 */
class FamiliaService
{
    private RepresentanteRepository $representanteRepo;
    private JugadorRepository $jugadorRepo;
    private AuditoriaRepository $auditoriaRepo;

    public function __construct(
        ?RepresentanteRepository $representanteRepo = null,
        ?JugadorRepository $jugadorRepo = null,
        ?AuditoriaRepository $auditoriaRepo = null
    ) {
        $this->representanteRepo = $representanteRepo ?? new RepresentanteRepository();
        $this->jugadorRepo       = $jugadorRepo ?? new JugadorRepository();
        $this->auditoriaRepo     = $auditoriaRepo ?? new AuditoriaRepository();
    }

    /**
     * Registra un nuevo representante en el padrón de la academia.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function crearRepresentante(
        string $academiaId,
        CrearRepresentanteDTO $dto,
        ?string $usuarioId = null
    ): array {
        if ($dto->cedula !== null) {
            $existente = $this->representanteRepo->buscarPorCedula($dto->cedula, $academiaId);
            if ($existente !== null) {
                throw ExcepcionApi::validacion("Ya existe un representante registrado con la cédula {$dto->cedula}.");
            }
        }

        $id = $this->representanteRepo->crear($academiaId, [
            'nombres'   => $dto->nombres,
            'apellidos' => $dto->apellidos,
            'telefono'  => $dto->telefono,
            'cedula'    => $dto->cedula,
            'correo'    => $dto->correo,
            'direccion' => $dto->direccion,
        ]);

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'CREAR_REPRESENTANTE',
            'negocio.representantes',
            $id,
            ['nombres' => $dto->nombres, 'apellidos' => $dto->apellidos, 'cedula' => $dto->cedula]
        );

        $representante = $this->representanteRepo->buscarPorId($id, $academiaId);
        if ($representante === null) {
            throw ExcepcionApi::servidor('Error al recuperar el representante recién creado.');
        }

        return $representante;
    }

    /**
     * Obtiene el grupo familiar completo asociado a un representante:
     * datos del tutor legal y listado de todos sus representados (hijos/atletas)
     * con sus categorías y equipos asignados.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function obtenerGrupoFamiliar(string $representanteId, string $academiaId): array
    {
        $grupo = $this->representanteRepo->obtenerGrupoFamiliar($representanteId, $academiaId);
        if ($grupo === null) {
            throw ExcepcionApi::noEncontrado('Representante no encontrado en esta academia.');
        }

        return $grupo;
    }

    /**
     * Vincula un jugador a un representante existente.
     *
     * @return array<string, mixed> Grupo familiar actualizado
     * @throws ExcepcionApi
     */
    public function vincularHijo(
        string $academiaId,
        string $representanteId,
        string $jugadorId,
        string $tipoRelacion = 'representante_legal',
        bool $esContactoPrincipal = false,
        ?string $usuarioId = null
    ): array {
        $rep = $this->representanteRepo->buscarPorId($representanteId, $academiaId);
        if ($rep === null) {
            throw ExcepcionApi::noEncontrado('Representante no encontrado en esta academia.');
        }

        $jug = $this->jugadorRepo->buscarPorId($jugadorId, $academiaId);
        if ($jug === null) {
            throw ExcepcionApi::noEncontrado('Jugador no encontrado en esta academia.');
        }

        $this->jugadorRepo->vincularRepresentante(
            $academiaId,
            $jugadorId,
            $representanteId,
            $tipoRelacion,
            $esContactoPrincipal
        );

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'VINCULAR_HIJO_REPRESENTANTE',
            'negocio.jugadores_representantes',
            $representanteId,
            [
                'jugador_id'     => $jugadorId,
                'tipo_relacion'  => $tipoRelacion,
                'es_principal'   => $esContactoPrincipal,
            ]
        );

        return $this->obtenerGrupoFamiliar($representanteId, $academiaId);
    }

    /**
     * Busca representantes que coincidan con un término en nombres, apellidos o cédula.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buscar(string $academiaId, string $termino, int $limite = 20): array
    {
        return $this->representanteRepo->buscar($academiaId, $termino, $limite);
    }

    /**
     * Actualiza los datos de contacto de un representante.
     *
     * @param array<string, mixed> $datos
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function actualizar(
        string $representanteId,
        string $academiaId,
        array $datos,
        ?string $usuarioId = null
    ): array {
        $rep = $this->representanteRepo->buscarPorId($representanteId, $academiaId);
        if ($rep === null) {
            throw ExcepcionApi::noEncontrado('Representante no encontrado.');
        }

        if (!empty($datos['cedula']) && $datos['cedula'] !== $rep['cedula']) {
            $existente = $this->representanteRepo->buscarPorCedula($datos['cedula'], $academiaId);
            if ($existente !== null && $existente['id'] !== $representanteId) {
                throw ExcepcionApi::validacion("Ya existe otro representante registrado con la cédula {$datos['cedula']}.");
            }
        }

        $this->representanteRepo->actualizar($representanteId, $academiaId, $datos);

        $this->auditoriaRepo->registrar(
            $academiaId,
            $usuarioId,
            'ACTUALIZAR_REPRESENTANTE',
            'negocio.representantes',
            $representanteId,
            $datos
        );

        $actualizado = $this->representanteRepo->buscarPorId($representanteId, $academiaId);
        if ($actualizado === null) {
            throw ExcepcionApi::servidor('Error al recuperar representante tras actualizar.');
        }

        return $actualizado;
    }
}
