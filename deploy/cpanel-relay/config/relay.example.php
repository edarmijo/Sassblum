<?php

declare(strict_types=1);

return [
    // Copiar como relay.php fuera de public/. Nunca versionar valores reales.
    'relay_secret' => 'replace-with-at-least-32-random-characters',
    'sender_email' => 'notificaciones@sassblum.com',
    'sender_name' => 'SassBlum',
    'smtp' => [
        'host' => 'mail.sassblum.com',
        'port' => 465,
        'username' => 'notificaciones@sassblum.com',
        'password' => 'replace-outside-git',
        'timeout_seconds' => 10,
    ],
    'limits' => [
        'per_minute' => 20,
        'per_hour' => 200,
        'max_payload_bytes' => 262144,
        'max_log_bytes' => 5242880,
        'idempotency_ttl_seconds' => 86400,
    ],
    'runtime_dir' => dirname(__DIR__) . '/runtime',
];
