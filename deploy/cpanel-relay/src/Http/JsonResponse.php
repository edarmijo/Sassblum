<?php

declare(strict_types=1);

namespace SassBlum\Relay\Http;

final class JsonResponse
{
    /** @var int */
    private $statusCode;

    /** @var array<string, string> */
    private $payload;

    /** @var array<string, string> */
    private $headers;

    /**
     * @param array<string, string> $payload
     * @param array<string, string> $headers
     */
    public function __construct(int $statusCode, array $payload, array $headers = [])
    {
        $this->statusCode = $statusCode;
        $this->payload = $payload;
        $this->headers = $headers;
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    /** @return array<string, string> */
    public function payload(): array
    {
        return $this->payload;
    }

    /** @return array<string, string> */
    public function headers(): array
    {
        return $this->headers;
    }

    public function emit(): void
    {
        http_response_code($this->statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
        echo json_encode($this->payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
