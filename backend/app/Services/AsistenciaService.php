<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\ExcepcionApi;
use App\DTOs\SincronizarAsistenciaDTO;
use App\Repositories\AsistenciaRepository;
use PDO;

class AsistenciaService
{
    private AsistenciaRepository $asistenciaRepository;

    public function __construct(?AsistenciaRepository $repo = null)
    {
        $this->asistenciaRepository = $repo ?? new AsistenciaRepository();
    }

    /**
     * Procesa un lote de asistencia offline proveniente de la app móvil.
     * La operación es totalmente transaccional e idempotente.
     */
    public function sincronizarLote(string $academiaId, string $usuarioId, SincronizarAsistenciaDTO $dto): array
    {
        $sesionesSincronizadas = [];
        $registrosSincronizados = 0;

        Database::transaction(function (PDO $db) use ($academiaId, $usuarioId, $dto, &$sesionesSincronizadas, &$registrosSincronizados) {
            // 1. Procesar Sesiones
            foreach ($dto->sesiones as $s) {
                $this->asistenciaRepository->guardarSesionIdempotente(
                    $s['id'],
                    $academiaId,
                    $s['equipo_id'],
                    $s['fecha_sesion'],
                    $s['lugar'] ?? null,
                    $s['observaciones'] ?? null,
                    $usuarioId
                );
                $sesionesSincronizadas[] = $s['id'];
            }

            // 2. Procesar Registros de Asistencia
            foreach ($dto->registros as $r) {
                $this->asistenciaRepository->guardarRegistroIdempotente(
                    $r['id'],
                    $academiaId,
                    $r['sesion_id'],
                    $r['jugador_id'],
                    $r['estado_asistencia'],
                    $r['observaciones'] ?? null
                );
                $registrosSincronizados++;
            }
        });

        return [
            'sesiones_procesadas'  => count($sesionesSincronizadas),
            'sesion_ids'           => $sesionesSincronizadas,
            'registros_procesados' => $registrosSincronizados,
            'sincronizado_en'      => date('c'),
        ];
    }

    /**
     * Lista el historial de sesiones registradas.
     */
    public function listarHistorial(string $academiaId, ?string $equipoId = null, int $limite = 50): array
    {
        return $this->asistenciaRepository->listarSesiones($academiaId, $equipoId, $limite);
    }
}
