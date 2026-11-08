<?php

declare(strict_types=1);

namespace App\Config;

use App\Core\Env;

return [
    'default' => Env::get('DB_CONNECTION', 'pgsql'),

    'connections' => [
        'pgsql' => [
            'driver'   => 'pgsql',
            'host'     => Env::get('DB_HOST', '127.0.0.1'),
            'port'     => (int)Env::get('DB_PORT', 5432),
            'database' => Env::get('DB_DATABASE', 'fichapp_db'),
            'username' => Env::get('DB_USERNAME', 'postgres'),
            'password' => Env::get('DB_PASSWORD', 'postgres'),
            'charset'  => 'utf8',
        ],

        'mysql' => [
            'driver'   => 'mysql',
            'host'     => Env::get('DB_HOST', '127.0.0.1'),
            'port'     => (int)Env::get('DB_PORT', 3306),
            'database' => Env::get('DB_DATABASE', 'fichapp_db'),
            'username' => Env::get('DB_USERNAME', 'root'),
            'password' => Env::get('DB_PASSWORD', ''),
            'charset'  => 'utf8mb4',
        ],

        'sqlite' => [
            'driver'   => 'sqlite',
            'database' => Env::get('DB_DATABASE', ':memory:'),
        ],
    ],
];
