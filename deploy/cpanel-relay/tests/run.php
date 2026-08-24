<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

use SassBlum\Relay\Config\RelayConfig;
use SassBlum\Relay\Controller\RelayController;
use SassBlum\Relay\Domain\RelayMessage;
use SassBlum\Relay\Exception\PayloadValidationException;
use SassBlum\Relay\Exception\RelayException;
use SassBlum\Relay\Logging\AuditLogger;
use SassBlum\Relay\Mailer\RelayMailerInterface;
use SassBlum\Relay\Security\FileRateLimiter;
use SassBlum\Relay\Security\IdempotencyStore;
use SassBlum\Relay\Security\SecretAuthenticator;
use SassBlum\Relay\Storage\LockedJsonFile;
use SassBlum\Relay\Validation\PayloadValidator;

const JSON_CONTENT_TYPE = 'application/json';
const TEST_RECIPIENT = 'cliente@example.test';

final class FakeMailer implements RelayMailerInterface
{
    /** @var bool */ private $fail;
    /** @var int */ public $calls = 0;
    /** @var RelayMessage|null */ public $lastMessage = null;

    public function __construct(bool $fail = false)
    {
        $this->fail = $fail;
    }

    public function send(RelayMessage $message): string
    {
        $this->calls++;
        $this->lastMessage = $message;
        if ($this->fail) {
            throw new RelayException('Synthetic SMTP failure containing no production data.');
        }
        return 'fake-accepted';
    }
}

/** @param mixed $actual @param mixed $expected */
function assertSameValue($expected, $actual, string $message): void
{
    if ($actual !== $expected) {
        throw new AssertionError($message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assertTrueValue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new AssertionError($message);
    }
}

/** @param callable(): void $callback */
function assertPayloadRejected(callable $callback, string $message): void
{
    try {
        $callback();
    } catch (PayloadValidationException $exception) {
        return;
    }
    throw new AssertionError($message);
}

/** @param callable(): void $callback */
function assertRelayRejected(callable $callback, string $message): void
{
    try {
        $callback();
    } catch (RelayException $exception) {
        return;
    }
    throw new AssertionError($message);
}

/** @return array<string, mixed> */
function validPayload(): array
{
    return [
        'html_body' => '<p>Observación/Solución: impresión corregida.</p>',
        'text_body' => 'Observación/Solución: impresión corregida.',
        'reply_to' => ['soporte@example.test'],
        'cc' => ['auditoria@example.test'],
        'to' => [TEST_RECIPIENT],
        'subject' => 'Ticket actualizado · solución aplicada',
        'message_id' => '123e4567-e89b-42d3-a456-426614174000',
        'version' => 1,
    ];
}

/** @param array<string, mixed> $payload */
function encodePayload(array $payload): string
{
    $encoded = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    return is_string($encoded) ? $encoded : '';
}

/** @return array{0: RelayController, 1: FakeMailer} */
function controllerFor(string $runtimeDir, bool $mailFails = false, int $perMinute = 20): array
{
    $secret = str_repeat('s', 32);
    $mailer = new FakeMailer($mailFails);
    $controller = new RelayController(
        new SecretAuthenticator($secret),
        new FileRateLimiter(new LockedJsonFile($runtimeDir, 'rate.json'), $perMinute, 200),
        new PayloadValidator(262144),
        new IdempotencyStore(new LockedJsonFile($runtimeDir, 'ids.json'), 86400),
        $mailer,
        new AuditLogger($runtimeDir, 1048576),
        262144
    );
    return [$controller, $mailer];
}

function removeTestDirectory(string $directory): void
{
    if (!is_dir($directory)) {
        return;
    }
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($iterator as $entry) {
        if ($entry->isDir()) {
            rmdir($entry->getPathname());
        } else {
            unlink($entry->getPathname());
        }
    }
    rmdir($directory);
}

$tests = [];
$tests['secret authentication uses exact values'] = function (): void {
    $auth = new SecretAuthenticator(str_repeat('a', 32));
    assertTrueValue($auth->isAuthorized(str_repeat('a', 32)), 'Known secret should pass.');
    assertTrueValue(!$auth->isAuthorized(str_repeat('a', 31) . 'b'), 'Different secret should fail.');
};
$tests['example configuration cannot be deployed unchanged'] = function (): void {
    assertRelayRejected(function (): void {
        RelayConfig::fromFile(dirname(__DIR__) . '/config/relay.example.php');
    }, 'Placeholder configuration must fail closed.');
};
$tests['valid private configuration loads'] = function () use (&$runtimeDir): void {
    if (!is_dir($runtimeDir) && !mkdir($runtimeDir, 0700, true) && !is_dir($runtimeDir)) {
        throw new AssertionError('Test directory could not be created.');
    }
    $path = $runtimeDir . '/valid-config.php';
    $values = [
        'relay_secret' => str_repeat('r', 64),
        'sender_email' => 'notificaciones@sassblum.com',
        'sender_name' => 'SassBlum',
        'smtp' => [
            'host' => 'mail.sassblum.com',
            'port' => 465,
            'username' => 'notificaciones@sassblum.com',
            'password' => 'synthetic-test-password',
            'timeout_seconds' => 10,
        ],
        'limits' => [
            'per_minute' => 20,
            'per_hour' => 200,
            'max_payload_bytes' => 262144,
            'max_log_bytes' => 1048576,
            'idempotency_ttl_seconds' => 86400,
        ],
        'runtime_dir' => $runtimeDir . '/state',
    ];
    file_put_contents($path, '<?php return ' . var_export($values, true) . ';');
    $config = RelayConfig::fromFile($path);
    assertSameValue('mail.sassblum.com', $config->smtpHost(), 'SMTP host must load.');
    $sameConfig = RelayConfig::fromFile($path);
    assertSameValue('mail.sassblum.com', $sameConfig->smtpHost(), 'Repeated config loads must stay valid.');
};
$tests['validator accepts unordered exact contract'] = function (): void {
    $message = (new PayloadValidator(262144))->validate(encodePayload(validPayload()));
    assertSameValue('Ticket actualizado · solución aplicada', $message->subject(), 'UTF-8 subject must be preserved.');
    assertSameValue([TEST_RECIPIENT], $message->to(), 'Recipient must be preserved.');
    assertSameValue(['auditoria@example.test'], $message->cc(), 'CC must be preserved.');
    assertSameValue(['soporte@example.test'], $message->replyTo(), 'Reply-To must be preserved.');
    assertSameValue('Observación/Solución: impresión corregida.', $message->textBody(), 'Text must preserve UTF-8.');
    assertSameValue('<p>Observación/Solución: impresión corregida.</p>', $message->htmlBody(), 'HTML must preserve UTF-8.');
};
$tests['validator rejects unknown fields and header injection'] = function (): void {
    $validator = new PayloadValidator(262144);
    $extra = validPayload();
    $extra['from'] = 'attacker@example.test';
    assertPayloadRejected(function () use ($validator, $extra): void {
        $validator->validate(encodePayload($extra));
    }, 'Unknown sender field should fail.');
    $injected = validPayload();
    $injected['subject'] = "Subject\r\nBcc: attacker@example.test";
    assertPayloadRejected(function () use ($validator, $injected): void {
        $validator->validate(encodePayload($injected));
    }, 'Header injection should fail.');
};
$tests['rate limiter enforces minute budget'] = function () use (&$runtimeDir): void {
    $limiter = new FileRateLimiter(new LockedJsonFile($runtimeDir, 'standalone-rate.json'), 2, 10);
    assertTrueValue($limiter->consume(1000), 'First attempt should pass.');
    assertTrueValue($limiter->consume(1001), 'Second attempt should pass.');
    assertTrueValue(!$limiter->consume(1002), 'Third attempt should be limited.');
    assertTrueValue($limiter->consume(1061), 'Window should expire.');
};
$tests['idempotency store releases failed claims'] = function () use (&$runtimeDir): void {
    $store = new IdempotencyStore(new LockedJsonFile($runtimeDir, 'standalone-ids.json'), 3600);
    assertTrueValue($store->claim('message', 1000), 'First claim should pass.');
    assertTrueValue(!$store->claim('message', 1001), 'Duplicate claim should fail.');
    $store->release('message');
    assertTrueValue($store->claim('message', 1002), 'Released claim should be reusable.');
};
$tests['controller sends once and returns duplicate confirmation'] = function () use (&$runtimeDir): void {
    list($controller, $mailer) = controllerFor($runtimeDir . '/sent');
    $body = encodePayload(validPayload());
    $first = $controller->handle('POST', 'application/json; charset=utf-8', str_repeat('s', 32), $body, 1000);
    $second = $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), $body, 1001);
    assertSameValue(200, $first->statusCode(), 'First request should pass.');
    assertSameValue('sent', $first->payload()['status'], 'First request must be sent.');
    assertSameValue('duplicate', $second->payload()['status'], 'Second request must be duplicate.');
    assertSameValue(1, $mailer->calls, 'SMTP should be called once.');
    assertTrueValue($mailer->lastMessage instanceof RelayMessage, 'Mailer must receive the validated message.');
    assertSameValue(validPayload()['cc'], $mailer->lastMessage->cc(), 'Controller must preserve CC.');
    assertSameValue(validPayload()['reply_to'], $mailer->lastMessage->replyTo(), 'Controller must preserve Reply-To.');
    assertSameValue(validPayload()['text_body'], $mailer->lastMessage->textBody(), 'Controller must preserve text.');
    assertSameValue(validPayload()['html_body'], $mailer->lastMessage->htmlBody(), 'Controller must preserve HTML.');
};
$tests['controller rejects invalid perimeter requests'] = function () use (&$runtimeDir): void {
    list($controller, $mailer) = controllerFor($runtimeDir . '/perimeter');
    $body = encodePayload(validPayload());
    assertSameValue(405, $controller->handle('GET', JSON_CONTENT_TYPE, str_repeat('s', 32), $body, 1000)->statusCode(), 'GET must fail.');
    assertSameValue(415, $controller->handle('POST', 'text/plain', str_repeat('s', 32), $body, 1000)->statusCode(), 'Wrong content type must fail.');
    assertSameValue(401, $controller->handle('POST', JSON_CONTENT_TYPE, 'wrong', $body, 1000)->statusCode(), 'Wrong secret must fail.');
    assertSameValue(413, $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), '', 1000)->statusCode(), 'Empty body must fail.');
    assertSameValue(422, $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), '{}', 1000)->statusCode(), 'Invalid payload must fail.');
    assertSameValue(0, $mailer->calls, 'Rejected requests must not call SMTP.');
};
$tests['controller applies authenticated rate limit'] = function () use (&$runtimeDir): void {
    list($controller, $mailer) = controllerFor($runtimeDir . '/limited', false, 1);
    $firstPayload = validPayload();
    $secondPayload = validPayload();
    $secondPayload['message_id'] = '123e4567-e89b-42d3-b456-426614174001';
    $first = $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), encodePayload($firstPayload), 1000);
    $second = $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), encodePayload($secondPayload), 1001);
    assertSameValue(200, $first->statusCode(), 'First request should pass.');
    assertSameValue(429, $second->statusCode(), 'Second request should be rate limited.');
    assertSameValue('60', $second->headers()['Retry-After'], 'Rate limit must expose retry delay.');
    assertSameValue(1, $mailer->calls, 'Limited request must not call SMTP.');
};
$tests['controller releases idempotency after SMTP failure'] = function () use (&$runtimeDir): void {
    list($controller, $mailer) = controllerFor($runtimeDir . '/failure', true);
    $body = encodePayload(validPayload());
    $first = $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), $body, 1000);
    $second = $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), $body, 1001);
    assertSameValue(502, $first->statusCode(), 'SMTP failure must surface as gateway failure.');
    assertSameValue(502, $second->statusCode(), 'Failed claim must be retryable.');
    assertSameValue(2, $mailer->calls, 'SMTP should be retried after failure.');
};
$tests['audit log excludes message content and addresses'] = function () use (&$runtimeDir): void {
    $directory = $runtimeDir . '/audit';
    list($controller) = controllerFor($directory);
    $payload = validPayload();
    $controller->handle('POST', JSON_CONTENT_TYPE, str_repeat('s', 32), encodePayload($payload), 1000);
    $log = file_get_contents($directory . '/relay.log');
    assertTrueValue(is_string($log), 'Audit log must exist.');
    assertTrueValue(strpos($log, TEST_RECIPIENT) === false, 'Recipient must not be logged.');
    assertTrueValue(strpos($log, 'Ticket actualizado') === false, 'Subject must not be logged.');
    assertTrueValue(strpos($log, 'impresión corregida') === false, 'Body must not be logged.');
    assertTrueValue(strpos($log, str_repeat('s', 32)) === false, 'Secret must not be logged.');
};

$runtimeDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'sassblum-relay-tests-' . bin2hex(random_bytes(8));
$failures = 0;
try {
    foreach ($tests as $name => $test) {
        try {
            $test();
            echo "PASS: {$name}\n";
        } catch (Throwable $exception) {
            $failures++;
            fwrite(STDERR, "FAIL: {$name}: {$exception->getMessage()}\n");
        }
    }
} finally {
    removeTestDirectory($runtimeDir);
}

if ($failures > 0) {
    exit(1);
}
echo 'All ' . count($tests) . " relay tests passed.\n";
