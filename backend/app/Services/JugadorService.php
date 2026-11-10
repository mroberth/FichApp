<?php

declare(strict_types=1);

namespace App\Services;

use PDOException;
use App\Core\Database;
use App\Core\ExcepcionApi;
use App\DTOs\RegistrarJugadorDTO;
use App\DTOs\ActualizarJugadorDTO;
use App\DTOs\AsignarEquipoDTO;
use App\Repositories\JugadorRepository;
use App\Repositories\RepresentanteRepository;
use App\Repositories\EquipoRepository;
use App\Repositories\AuditoriaRepository;

/**
 * Servicio de dominio para el registro integral de jugadores, gestión de fichas deportivas,
 * asignaciones a planteles y auditoría.
 */
class JugadorService
{
    private JugadorRepository $jugadorRepo;
    private RepresentanteRepository $representanteRepo;
    private EquipoRepository $equipoRepo;
    private AuditoriaRepository $auditoriaRepo;

    public function __construct(
        ?JugadorRepository $jugadorRepo = null,
        ?RepresentanteRepository $representanteRepo = null,
        ?EquipoRepository $equipoRepo = null,
        ?AuditoriaRepository $auditoriaRepo = null
    ) {
        $this->jugadorRepo       = $jugadorRepo ?? new JugadorRepository();
        $this->representanteRepo = $representanteRepo ?? new RepresentanteRepository();
        $this->equipoRepo        = $equipoRepo ?? new EquipoRepository();
        $this->auditoriaRepo     = $auditoriaRepo ?? new AuditoriaRepository();
    }

    /**
     * Registra un jugador de manera transaccional e integral:
     * 1. Resuelve o crea el representante familiar (soporte multihijo).
     * 2. Registra los datos personales y médicos del atleta.
     * 3. Crea el vínculo de parentesco (jugador - representante).
     * 4. Asigna al atleta al equipo deportivo si se especificó.
     * 5. Emite registro de auditoría.
     *
     * @return array<string, mixed> Ficha deportiva completa registrada
     * @throws ExcepcionApi
     */
    public function registrarJugador(
        string $academiaId,
        RegistrarJugadorDTO $dto,
        ?string $usuarioId = null
    ): array {
        // Validar unicidad de cédula en la academia si fue suministrada
        if ($dto->cedula !== null) {
            $existente = $this->jugadorRepo->buscarPorCedula($dto->cedula, $academiaId);
            if ($existente !== null) {
                throw ExcepcionApi::yaExiste("Ya existe un jugador registrado con la cédula {$dto->cedula}.");
            }
        }

        // Validar existencia de equipo si fue indicado
        if ($dto->equipoId !== null) {
            $equipo = $this->equipoRepo->buscarPorId($dto->equipoId, $academiaId);
            if ($equipo === null) {
                throw ExcepcionApi::noEncontrado('El equipo deportivo indicado no existe en esta academia.');
            }
        }

        // Validar existencia de representante si se envió por ID
        if ($dto->representanteId !== null) {
            $rep = $this->representanteRepo->buscarPorId($dto->representanteId, $academiaId);
            if ($rep === null) {
                throw ExcepcionApi::noEncontrado('El representante indicado no existe en esta academia.');
            }
        }

        // Orquestar transacción atómica
        try {
            return Database::transaction(function () use ($academiaId, $dto, $usuarioId) {
                $representanteId = $dto->representanteId;

                // Si no viene ID de representante, buscar o crear a partir de datosRepresentante
                if ($representanteId === null && $dto->datosRepresentante !== null) {
                    $datosRep = $dto->datosRepresentante;

                    // Si tiene cédula, comprobar si ya existe para reutilizar el tutor en familias multihijo
                    if ($datosRep->cedula !== null) {
                        $repExistente = $this->representanteRepo->buscarPorCedula($datosRep->cedula, $academiaId);
                        if ($repExistente !== null) {
                            $representanteId = (string)$repExistente['id'];
                        }
                    }

                    // Si no existía, insertarlo en el padrón
                    if ($representanteId === null) {
                        $representanteId = $this->representanteRepo->crear($academiaId, [
                            'nombres'   => $datosRep->nombres,
                            'apellidos' => $datosRep->apellidos,
                            'telefono'  => $datosRep->telefono,
                            'cedula'    => $datosRep->cedula,
                            'correo'    => $datosRep->correo,
                            'direccion' => $datosRep->direccion,
                        ]);

                        $this->auditoriaRepo->registrar(
                            $academiaId,
                            $usuarioId,
                            'CREAR_REPRESENTANTE',
                            'negocio.representantes',
                            $representanteId,
                            ['nombres' => $datosRep->nombres, 'apellidos' => $datosRep->apellidos]
                        );
                    }
                }

                if ($representanteId === null) {
                    throw ExcepcionApi::validacion('No fue posible asociar o crear el representante para el jugador.');
                }

                // 2. Crear la ficha del jugador
                $jugadorId = $this->jugadorRepo->crear($academiaId, [
                    'nombres'          => $dto->nombres,
                    'apellidos'        => $dto->apellidos,
                    'fecha_nacimiento' => $dto->fechaNacimiento,
                    'cedula'           => $dto->cedula,
                    'sexo'             => $dto->sexo,
                    'ficha_medica'     => $dto->fichaMedica,
                    'estado'           => 'activo',
                ]);

                // 3. Vincular jugador y representante
                $this->jugadorRepo->vincularRepresentante(
                    $academiaId,
                    $jugadorId,
                    $representanteId,
                    $dto->tipoRelacion,
                    $dto->esContactoPrincipal
                );

                // 4. Asignar a equipo si aplica
                if ($dto->equipoId !== null) {
                    $this->jugadorRepo->asignarAEquipo(
                        $academiaId,
                        $jugadorId,
                        $dto->equipoId,
                        $dto->temporada,
                        $dto->numeroCamiseta,
                        $dto->posicion
                    );
                }

                // 5. Auditoría
                $this->auditoriaRepo->registrar(
                    $academiaId,
                    $usuarioId,
                    'REGISTRAR_JUGADOR',
                    'negocio.jugadores',
                    $jugadorId,
                    [
                        'nombres'          => $dto->nombres,
                        'apellidos'        => $dto->apellidos,
                        'representante_id' => $representanteId,
                        'equipo_id'        => $dto->equipoId,
                    ]
                );

                $ficha = $this->jugadorRepo->obtenerFichaCompleta($jugadorId, $academiaId);
                if ($ficha === null) {
                    throw ExcepcionApi::errorInterno('Error al recuperar la ficha del jugador recién creado.');
                }

                return $ficha;
            });
        } catch (PDOException $e) {
            // Manejo de condición de carrera en restricción de unicidad PostgreSQL (SQLSTATE 23505)
            if ($e->getCode() === '23505') {
                throw ExcepcionApi::yaExiste('Conflicto de unicidad: Ya existe un registro coincidente en la academia.');
            }
            throw $e;
        }
    }

    /**
     * Obtiene la ficha consolidada de un atleta.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function obtenerFicha(string $jugadorId, string $academiaId): array
    {
        $ficha = $this->jugadorRepo->obtenerFichaCompleta($jugadorId, $academiaId);
        if ($ficha === null) {
            throw ExcepcionApi::noEncontrado('Jugador no encontrado en la academia especificada.');
        }

        return $ficha;
    }

    /**
     * Lista los jugadores aplicando filtros y paginación.
     *
     * @param array<string, mixed> $filtros
     * @return array{total: int, items: array<int, array<string, mixed>>, limite: int, offset: int}
     */
    public function listar(string $academiaId, array $filtros = []): array
    {
        $limite = isset($filtros['limite']) ? max(1, min(100, (int)$filtros['limite'])) : 50;
        $offset = isset($filtros['offset']) ? max(0, (int)$filtros['offset']) : 0;

        $filtrosConPaginacion = array_merge($filtros, [
            'limite' => $limite,
            'offset' => $offset,
        ]);

        $total = $this->jugadorRepo->contar($academiaId, $filtros);
        $items = $this->jugadorRepo->listar($academiaId, $filtrosConPaginacion);

        return [
            'total'  => $total,
            'items'  => $items,
            'limite' => $limite,
            'offset' => $offset,
        ];
    }

    /**
     * Actualiza los datos de un jugador.
     *
     * @return array<string, mixed> Ficha actualizada
     * @throws ExcepcionApi
     */
    public function actualizar(
        string $jugadorId,
        string $academiaId,
        ActualizarJugadorDTO $dto,
        ?string $usuarioId = null
    ): array {
        $jugador = $this->jugadorRepo->buscarPorId($jugadorId, $academiaId);
        if ($jugador === null) {
            throw ExcepcionApi::noEncontrado('Jugador no encontrado.');
        }

        // Si se modifica la cédula, validar que no choque con otro jugador
        if ($dto->cedula !== null && $dto->cedula !== $jugador['cedula']) {
            $existente = $this->jugadorRepo->buscarPorCedula($dto->cedula, $academiaId);
            if ($existente !== null && $existente['id'] !== $jugadorId) {
                throw ExcepcionApi::yaExiste("Ya existe otro jugador registrado con la cédula {$dto->cedula}.");
            }
        }

        $datosActualizar = $dto->aArrayFiltrado();
        if (!empty($datosActualizar)) {
            $this->jugadorRepo->actualizar($jugadorId, $academiaId, $datosActualizar);

            $this->auditoriaRepo->registrar(
                $academiaId,
                $usuarioId,
                'ACTUALIZAR_JUGADOR',
                'negocio.jugadores',
                $jugadorId,
                $datosActualizar
            );
        }

        return $this->obtenerFicha($jugadorId, $academiaId);
    }

    /**
     * Realiza el borrado lógico de un jugador.
     *
     * @throws ExcepcionApi
     */
    public function eliminar(string $jugadorId, string $academiaId, ?string $usuarioId = null): bool
    {
        $jugador = $this->jugadorRepo->buscarPorId($jugadorId, $academiaId);
        if ($jugador === null) {
            throw ExcepcionApi::noEncontrado('Jugador no encontrado.');
        }

        $exito = $this->jugadorRepo->eliminar($jugadorId, $academiaId);

        if ($exito) {
            $this->auditoriaRepo->registrar(
                $academiaId,
                $usuarioId,
                'ELIMINAR_JUGADOR',
                'negocio.jugadores',
                $jugadorId,
                ['nombre_completo' => "{$jugador['nombres']} {$jugador['apellidos']}"]
            );
        }

        return $exito;
    }

    /**
     * Asigna un atleta a un equipo deportivo en una temporada.
     *
     * @return array<string, mixed> Ficha consolidada tras la asignación
     * @throws ExcepcionApi
     */
    public function asignarAEquipo(
        string $academiaId,
        AsignarEquipoDTO $dto,
        ?string $usuarioId = null
    ): array {
        $jugador = $this->jugadorRepo->buscarPorId($dto->jugadorId, $academiaId);
        if ($jugador === null) {
            throw ExcepcionApi::noEncontrado('El jugador no existe en esta academia.');
        }

        $equipo = $this->equipoRepo->buscarPorId($dto->equipoId, $academiaId);
        if ($equipo === null) {
            throw ExcepcionApi::noEncontrado('El equipo no existe en esta academia.');
        }

        return Database::transaction(function () use ($academiaId, $dto, $usuarioId) {
            $this->jugadorRepo->asignarAEquipo(
                $academiaId,
                $dto->jugadorId,
                $dto->equipoId,
                $dto->temporada,
                $dto->numeroCamiseta,
                $dto->posicion
            );

            $this->auditoriaRepo->registrar(
                $academiaId,
                $usuarioId,
                'ASIGNAR_JUGADOR_EQUIPO',
                'negocio.asignaciones_jugadores_equipos',
                $dto->jugadorId,
                [
                    'equipo_id'       => $dto->equipoId,
                    'temporada'       => $dto->temporada,
                    'numero_camiseta' => $dto->numeroCamiseta,
                    'posicion'        => $dto->posicion,
                ]
            );

            return $this->obtenerFicha($dto->jugadorId, $academiaId);
        });
    }
}
