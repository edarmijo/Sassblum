<?php

declare(strict_types=1);

namespace SassBlum\Relay\Security;

use SassBlum\Relay\Storage\LockedJsonFile;

final class FileRateLimiter
{
    /** @var LockedJsonFile */ private $state;
    /** @var int */ private $perMinute;
    /** @var int */ private $perHour;

    public function __construct(LockedJsonFile $state, int $perMinute, int $perHour)
    {
        $this->state = $state;
        $this->perMinute = $perMinute;
        $this->perHour = $perHour;
    }

    public function consume(int $now): bool
    {
        return (bool) $this->state->mutate(function (array $state) use ($now): array {
            $attempts = isset($state['attempts']) && is_array($state['attempts'])
                ? $state['attempts']
                : [];
            $attempts = array_values(array_filter($attempts, function ($timestamp) use ($now): bool {
                return is_int($timestamp) && $timestamp > $now - 3600;
            }));
            $minuteCount = count(array_filter($attempts, function (int $timestamp) use ($now): bool {
                return $timestamp > $now - 60;
            }));
            if ($minuteCount >= $this->perMinute || count($attempts) >= $this->perHour) {
                return [['attempts' => $attempts], false];
            }
            $attempts[] = $now;
            return [['attempts' => $attempts], true];
        });
    }
}
