<?php

declare(strict_types=1);

namespace SassBlum\Relay\Logging;

use SassBlum\Relay\Domain\RelayMessage;
use SassBlum\Relay\Exception\RelayException;

final class AuditLogger
{
    /** @var string */ private $path;
    /** @var int */ private $maxBytes;

    public function __construct(string $runtimeDir, int $maxBytes)
    {
        if (!is_dir($runtimeDir) && !mkdir($runtimeDir, 0700, true) && !is_dir($runtimeDir)) {
            throw new RelayException('Relay log directory cannot be created.');
        }
        $this->path = rtrim($runtimeDir, '/\\') . DIRECTORY_SEPARATOR . 'relay.log';
        $this->maxBytes = $maxBytes;
    }

    public function record(RelayMessage $message, string $result, string $providerCode): void
    {
        $this->rotateIfNeeded();
        $entry = json_encode([
            'timestamp' => gmdate('c'),
            'message_id' => $message->messageId(),
            'recipient_hash' => $message->recipientHash(),
            'result' => $result,
            'provider_code' => $providerCode,
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if (file_put_contents($this->path, $entry . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
            throw new RelayException('Relay audit log cannot be written.');
        }
        @chmod($this->path, 0600);
    }

    private function rotateIfNeeded(): void
    {
        clearstatcache(true, $this->path);
        if (!is_file($this->path) || filesize($this->path) < $this->maxBytes) {
            return;
        }
        $rotated = $this->path . '.1';
        if (is_file($rotated) && !unlink($rotated)) {
            throw new RelayException('Relay audit log cannot be rotated.');
        }
        if (!rename($this->path, $rotated)) {
            throw new RelayException('Relay audit log cannot be rotated.');
        }
    }
}
