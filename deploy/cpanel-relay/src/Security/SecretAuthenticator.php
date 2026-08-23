<?php

declare(strict_types=1);

namespace SassBlum\Relay\Security;

use SassBlum\Relay\Exception\RelayException;

final class SecretAuthenticator
{
    /** @var string */
    private $knownSecret;

    public function __construct(string $knownSecret)
    {
        if (strlen($knownSecret) < 32 || preg_match('/[\r\n]/', $knownSecret) === 1) {
            throw new RelayException('Relay secret configuration is invalid.');
        }
        $this->knownSecret = $knownSecret;
    }

    public function isAuthorized(string $providedSecret): bool
    {
        return hash_equals($this->knownSecret, $providedSecret);
    }
}
