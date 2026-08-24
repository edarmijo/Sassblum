<?php

declare(strict_types=1);

namespace SassBlum\Relay\Mailer;

use SassBlum\Relay\Domain\RelayMessage;

interface RelayMailerInterface
{
    public function send(RelayMessage $message): string;
}
