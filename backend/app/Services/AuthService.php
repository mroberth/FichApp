<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Env;
use App\Core\ExcepcionApi;
use App\DTOs\LoginDTO;
use App\Repositories\UsuarioRepository;
use App\Repositories\SesionTokenRepository;
use App\Repositories\AuditoriaRepository;

/**
 * Servicio de negocio para la autenticación, generación de hashes criptográficos
 * y emisión/revocación de tokens Bearer.
 */
class AuthService
{
    private UsuarioRepository $usuarioRepo;
    private SesionTokenRepository $sesionRepo;
    private AuditoriaRepository $auditoriaRepo;

    public function __construct(
        ?UsuarioRepository $usuarioRepo = null,
        ?SesionTokenRepository $sesionRepo = null,
        ?AuditoriaRepository $auditoriaRepo = null
    ) {
        $this->usuarioRepo   = $usuarioRepo ?? new UsuarioRepository();
        $this->sesionRepo    = $sesionRepo ?? new SesionTokenRepository();
        $this->auditoriaRepo = $auditoriaRepo ?? new AuditoriaRepository();
    }

    /**
     * Autentica un usuario verificando credenciales, estado de cuenta y academia.
     * Retorna el token Bearer generado y los datos del usuario.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function login(LoginDTO $dto, ?string $ip = null, ?string $userAgent = null): array
    {
        // 1. Buscar usuario por identificador de acceso o correo
        $usuario = $this->usuarioRepo->buscarPorAccesoYAcademia(
            $dto->identificadorAcceso,
            $dto->academiaId
        );

        // Protección contra enumeración de usuarios: mensaje idéntico si no existe
        if ($usuario === null) {
            throw ExcepcionApi::noAutenticado('Credenciales de acceso incorrectas.');
        }

        // 2. Verificar hash criptográfico de contraseña (Bcrypt / Argon2)
        if (!password_verify($dto->contrasena, $usuario['contrasena_hash'])) {
            $this->auditoriaRepo->registrar(
                $usuario['academia_id'],
                $usuario['id'],
                'LOGIN_FALLIDO',
                'seguridad.usuarios',
                $usuario['id'],
                [
                    'ip'         => $ip,
                    'user_agent' => $userAgent,
                    'motivo'     => 'contrasena_incorrecta',
                ]
            );

            throw ExcepcionApi::noAutenticado('Credenciales de acceso incorrectas.');
        }

        // 3. Validar estado de la cuenta del usuario
        if ($usuario['estado'] !== 'activo') {
            throw ExcepcionApi::accesoDenegado('La cuenta de usuario se encuentra inactiva o suspendida.');
        }

        // 4. Validar estado de la academia (Tenant)
        if ($usuario['academia_estado'] !== 'activo') {
            throw ExcepcionApi::accesoDenegado('La academia se encuentra inactiva o suspendida.');
        }

        // 5. Generar token criptográficamente seguro (256 bits de entropía en hexadecimal = 64 chars)
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        // 6. Calcular vigencia del token (por defecto 30 días)
        $diasExpiracion = (int)Env::get('AUTH_TOKEN_DAYS', 30);
        if ($diasExpiracion <= 0) {
            $diasExpiracion = 30;
        }
        $expiraEn = date('Y-m-d H:i:s', strtotime("+{$diasExpiracion} days"));

        // 7. Persistir la sesión en la base de datos
        $this->sesionRepo->crear(
            $usuario['academia_id'],
            $usuario['id'],
            $tokenHash,
            $expiraEn,
            $ip,
            $userAgent
        );

        // 8. Registrar auditoría de inicio de sesión exitoso
        $this->auditoriaRepo->registrar(
            $usuario['academia_id'],
            $usuario['id'],
            'LOGIN_EXITOSO',
            'seguridad.usuarios',
            $usuario['id'],
            [
                'ip'         => $ip,
                'user_agent' => $userAgent,
            ]
        );

        return [
            'token'     => $token,
            'tipo'      => 'Bearer',
            'expira_en' => $expiraEn,
            'usuario'   => [
                'id'                   => $usuario['id'],
                'academia_id'          => $usuario['academia_id'],
                'nombre'               => $usuario['nombre'],
                'identificador_acceso' => $usuario['identificador_acceso'],
                'correo'               => $usuario['correo'],
                'telefono'             => $usuario['telefono'],
                'rol'                  => $usuario['rol'],
                'academia'             => [
                    'id'     => $usuario['academia_id'],
                    'nombre' => $usuario['academia_nombre'],
                    'estado' => $usuario['academia_estado'],
                ],
            ],
        ];
    }

    /**
     * Valida un token Bearer en texto plano, buscando su hash en la base de datos.
     * Retorna los datos del usuario si el token es válido y está vigente.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
    public function validarToken(string $token): array
    {
        if (trim($token) === '') {
            throw ExcepcionApi::noAutenticado('El token de autenticación no puede estar vacío.');
        }

        $tokenHash = hash('sha256', $token);
        $sesion = $this->sesionRepo->buscarSesionActiva($tokenHash);

        if ($sesion === null) {
            throw ExcepcionApi::noAutenticado('Token de autenticación inválido, expirado o revocado.');
        }

        // Validar que el usuario siga activo
        if ($sesion['usuario_estado'] !== 'activo') {
            $this->sesionRepo->revocar($tokenHash);
            throw ExcepcionApi::accesoDenegado('La cuenta de usuario asociada ha sido desactivada.');
        }

        // Validar que la academia siga activa
        if ($sesion['academia_estado'] !== 'activo') {
            throw ExcepcionApi::accesoDenegado('La academia se encuentra inactiva o suspendida.');
        }

        return [
            'id'                   => $sesion['usuario_id'],
            'academia_id'          => $sesion['academia_id'],
            'nombre'               => $sesion['usuario_nombre'],
            'identificador_acceso' => $sesion['identificador_acceso'],
            'correo'               => $sesion['usuario_correo'],
            'telefono'             => $sesion['usuario_telefono'],
            'rol'                  => $sesion['usuario_rol'],
            'academia'             => [
                'id'     => $sesion['academia_id'],
                'nombre' => $sesion['academia_nombre'],
                'estado' => $sesion['academia_estado'],
            ],
            'sesion'               => [
                'id'         => $sesion['sesion_id'],
                'expira_en'  => $sesion['expira_en'],
                'creada_en'  => $sesion['sesion_creada_en'],
            ],
        ];
    }

    /**
     * Cierra la sesión activa revocando el token Bearer.
     */
    public function logout(string $token): bool
    {
        $tokenHash = hash('sha256', $token);
        return $this->sesionRepo->revocar($tokenHash);
    }
}
