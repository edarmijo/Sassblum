<?php

declare(strict_types=1);

namespace SassBlum\Relay\Security;

use SassBlum\Relay\Storage\LockedJsonFile;

final class IdempotencyStore
{
    private const PROCESSING_TTL_SECONDS = 300;

    /** @var LockedJsonFile */ private $state;
    /** @var int */ private $ttlSeconds;

    public function __construct(LockedJsonFile $state, int $ttlSeconds)
    {
        $this->state = $state;
        $this->ttlSeconds = $ttlSeconds;
    }

    public function claim(string $messageId, int $now): bool
    {
        return (bool) $this->state->mutate(function (array $state) use ($messageId, $now): array {
            $active = [];
            foreach ($state as $id => $entry) {
                if (!is_array($entry) || !isset($entry['time'], $entry['status']) || !is_int($entry['time'])) {
                    continue;
                }
                $status = $entry['status'];
                $minimumTime = $status === 'processing'
                    ? $now - min(self::PROCESSING_TTL_SECONDS, $this->ttlSeconds)
                    : $now - $this->ttlSeconds;
                if (($status === 'processing' || $status === 'delivered') && $entry['time'] > $minimumTime) {
                    $active[(string) $id] = $entry;
                }
            }
            if (isset($active[$messageId])) {
                return [$active, false];
            }
            $active[$messageId] = ['time' => $now, 'status' => 'processing'];
            return [$active, true];
        });
    }

    public function markDelivered(string $messageId, int $now): void
    {
        $this->state->mutate(function (array $state) use ($messageId, $now): array {
            $state[$messageId] = ['time' => $now, 'status' => 'delivered'];
            return [$state, null];
        });
    }

    public function release(string $messageId): void
    {
        $this->state->mutate(function (array $state) use ($messageId): array {
            unset($state[$messageId]);
            return [$state, null];
        });
    }
}
