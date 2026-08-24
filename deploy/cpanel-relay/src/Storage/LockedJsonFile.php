<?php

declare(strict_types=1);

namespace SassBlum\Relay\Storage;

use JsonException;
use SassBlum\Relay\Exception\RelayException;

final class LockedJsonFile
{
    private const INVALID_STATE_MESSAGE = 'Relay runtime state is invalid.';

    /** @var string */
    private $path;

    public function __construct(string $runtimeDir, string $filename)
    {
        if (!is_dir($runtimeDir) && !mkdir($runtimeDir, 0700, true) && !is_dir($runtimeDir)) {
            throw new RelayException('Relay runtime directory cannot be created.');
        }
        $this->path = rtrim($runtimeDir, '/\\') . DIRECTORY_SEPARATOR . $filename;
    }

    /**
     * @param callable(array<string, mixed>): array{0: array<string, mixed>, 1: mixed} $callback
     * @return mixed
     */
    public function mutate(callable $callback)
    {
        $handle = fopen($this->path, 'c+');
        if ($handle === false || !flock($handle, LOCK_EX)) {
            if (is_resource($handle)) {
                fclose($handle);
            }
            throw new RelayException('Relay runtime state cannot be locked.');
        }
        try {
            rewind($handle);
            $raw = stream_get_contents($handle);
            $state = $this->decodeState($raw === false ? '' : $raw);
            list($nextState, $result) = $callback($state);
            $encoded = json_encode($nextState, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            rewind($handle);
            if (!ftruncate($handle, 0) || fwrite($handle, $encoded) === false || !fflush($handle)) {
                throw new RelayException('Relay runtime state cannot be persisted.');
            }
            @chmod($this->path, 0600);
            return $result;
        } catch (JsonException $exception) {
            throw new RelayException(self::INVALID_STATE_MESSAGE, 0, $exception);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** @return array<string, mixed> */
    private function decodeState(string $raw): array
    {
        if ($raw === '') {
            return [];
        }
        try {
            $decoded = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RelayException(self::INVALID_STATE_MESSAGE, 0, $exception);
        }
        if (!is_array($decoded)) {
            throw new RelayException(self::INVALID_STATE_MESSAGE);
        }
        return $decoded;
    }
}
