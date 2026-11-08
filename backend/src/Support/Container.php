<?php

declare(strict_types=1);

namespace FichApp\Support;

use RuntimeException;

/**
 * Contenedor ligero de inyección de dependencias (PSR-11 compatible).
 */
final class Container
{
    private static ?self $instance = null;

    /** @var array<string, callable> */
    private array $bindings = [];

    /** @var array<string, mixed> */
    private array $instances = [];

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function bind(string $id, callable $resolver): void
    {
        $this->bindings[$id] = $resolver;
        unset($this->instances[$id]);
    }

    public function singleton(string $id, mixed $resolver): void
    {
        if (is_callable($resolver)) {
            $this->bindings[$id] = $resolver;
        } else {
            $this->instances[$id] = $resolver;
        }
    }

    public function get(string $id): mixed
    {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }

        if (isset($this->bindings[$id])) {
            $resolved = ($this->bindings[$id])($this);
            $this->instances[$id] = $resolved;
            return $resolved;
        }

        // Auto-resolución si la clase existe
        if (class_exists($id)) {
            return new $id();
        }

        throw new RuntimeException("Servicio o clase no registrada en el contenedor: '{$id}'");
    }

    public function has(string $id): bool
    {
        return isset($this->instances[$id]) || isset($this->bindings[$id]) || class_exists($id);
    }
}
