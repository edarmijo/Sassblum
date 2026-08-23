<?php

declare(strict_types=1);

use SassBlum\Relay\Config\RelayConfig;
use SassBlum\Relay\Controller\RelayController;
use SassBlum\Relay\Http\JsonResponse;
use SassBlum\Relay\Logging\AuditLogger;
use SassBlum\Relay\Mailer\PhpMailerRelayMailer;
use SassBlum\Relay\Security\FileRateLimiter;
use SassBlum\Relay\Security\IdempotencyStore;
use SassBlum\Relay\Security\SecretAuthenticator;
use SassBlum\Relay\Storage\LockedJsonFile;
use SassBlum\Relay\Validation\PayloadValidator;

$root = dirname(__DIR__);
require_once $root . '/vendor/autoload.php';
ini_set('display_errors', '0');
ini_set('log_errors', '1');

try {
    $isHttps = (isset($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) === 'on')
        || (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443');
    if (!$isHttps) {
        (new JsonResponse(400, ['status' => 'error']))->emit();
        exit;
    }

    $configuredPath = getenv('SASSBLUM_RELAY_CONFIG');
    $configPath = is_string($configuredPath) && $configuredPath !== ''
        ? $configuredPath
        : $root . '/config/relay.php';
    $config = RelayConfig::fromFile($configPath);
    $runtimeDir = $config->runtimeDir();
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > $config->maxPayloadBytes()) {
        (new JsonResponse(413, ['status' => 'error']))->emit();
        exit;
    }

    $controller = new RelayController(
        new SecretAuthenticator($config->relaySecret()),
        new FileRateLimiter(
            new LockedJsonFile($runtimeDir, 'rate-limit.json'),
            $config->perMinute(),
            $config->perHour()
        ),
        new PayloadValidator($config->maxPayloadBytes()),
        new IdempotencyStore(
            new LockedJsonFile($runtimeDir, 'idempotency.json'),
            $config->idempotencyTtl()
        ),
        new PhpMailerRelayMailer($config),
        new AuditLogger($runtimeDir, $config->maxLogBytes()),
        $config->maxPayloadBytes()
    );

    $rawBody = file_get_contents('php://input');
    $response = $controller->handle(
        isset($_SERVER['REQUEST_METHOD']) ? (string) $_SERVER['REQUEST_METHOD'] : '',
        isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '',
        isset($_SERVER['HTTP_X_SASSBLUM_RELAY_SECRET'])
            ? (string) $_SERVER['HTTP_X_SASSBLUM_RELAY_SECRET']
            : '',
        is_string($rawBody) ? $rawBody : '',
        time()
    );
} catch (Throwable $exception) {
    error_log('SassBlum relay bootstrap failed: ' . get_class($exception));
    $response = new JsonResponse(500, ['status' => 'error']);
}

$response->emit();
