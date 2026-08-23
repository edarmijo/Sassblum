<?php

declare(strict_types=1);

namespace SassBlum\Relay\Config;

use SassBlum\Relay\Exception\RelayException;

final class RelayConfig
{
    /** @var array<string, mixed> */
    private $values;

    /** @param array<string, mixed> $values */
    private function __construct(array $values)
    {
        $this->values = $values;
        $this->validate();
    }

    public static function fromFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new RelayException('Relay configuration file is unavailable.');
        }
        $values = require $path;
        if (!is_array($values)) {
            throw new RelayException('Relay configuration is invalid.');
        }
        return new self($values);
    }

    public function relaySecret(): string { return $this->string('relay_secret'); }
    public function senderEmail(): string { return $this->string('sender_email'); }
    public function senderName(): string { return $this->string('sender_name'); }
    public function runtimeDir(): string { return $this->string('runtime_dir'); }
    public function smtpHost(): string { return $this->nestedString('smtp', 'host'); }
    public function smtpPort(): int { return $this->nestedPositiveInt('smtp', 'port'); }
    public function smtpUsername(): string { return $this->nestedString('smtp', 'username'); }
    public function smtpPassword(): string { return $this->nestedString('smtp', 'password'); }
    public function smtpTimeout(): int { return $this->nestedPositiveInt('smtp', 'timeout_seconds'); }
    public function perMinute(): int { return $this->nestedPositiveInt('limits', 'per_minute'); }
    public function perHour(): int { return $this->nestedPositiveInt('limits', 'per_hour'); }
    public function maxPayloadBytes(): int { return $this->nestedPositiveInt('limits', 'max_payload_bytes'); }
    public function maxLogBytes(): int { return $this->nestedPositiveInt('limits', 'max_log_bytes'); }
    public function idempotencyTtl(): int { return $this->nestedPositiveInt('limits', 'idempotency_ttl_seconds'); }

    private function validate(): void
    {
        if (
            strlen($this->relaySecret()) < 32
            || $this->relaySecret() === 'replace-with-at-least-32-random-characters'
        ) {
            throw new RelayException('Relay secret configuration is invalid.');
        }
        if (filter_var($this->senderEmail(), FILTER_VALIDATE_EMAIL) === false) {
            throw new RelayException('Sender configuration is invalid.');
        }
        if (
            filter_var($this->smtpUsername(), FILTER_VALIDATE_EMAIL) === false
            || strcasecmp($this->senderEmail(), $this->smtpUsername()) !== 0
            || $this->smtpPassword() === 'replace-outside-git'
        ) {
            throw new RelayException('SMTP identity configuration is invalid.');
        }
        if (
            filter_var($this->smtpHost(), FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false
            || preg_match('/[\r\n]/', $this->senderName()) === 1
        ) {
            throw new RelayException('SMTP host configuration is invalid.');
        }
        if ($this->perHour() < $this->perMinute()) {
            throw new RelayException('Rate limit configuration is invalid.');
        }
        if ($this->smtpPort() > 65535 || $this->smtpTimeout() > 60) {
            throw new RelayException('SMTP numeric configuration is invalid.');
        }
    }

    private function string(string $key): string
    {
        $value = $this->values[$key] ?? null;
        if (!is_string($value) || trim($value) === '') {
            throw new RelayException('Relay configuration is incomplete.');
        }
        return $value;
    }

    private function nestedString(string $section, string $key): string
    {
        $values = $this->section($section);
        $value = $values[$key] ?? null;
        if (!is_string($value) || trim($value) === '') {
            throw new RelayException('Relay configuration is incomplete.');
        }
        return $value;
    }

    private function nestedPositiveInt(string $section, string $key): int
    {
        $values = $this->section($section);
        $value = $values[$key] ?? null;
        if (!is_int($value) || $value <= 0) {
            throw new RelayException('Relay numeric configuration is invalid.');
        }
        return $value;
    }

    /** @return array<string, mixed> */
    private function section(string $name): array
    {
        $value = $this->values[$name] ?? null;
        if (!is_array($value)) {
            throw new RelayException('Relay configuration section is invalid.');
        }
        return $value;
    }
}
