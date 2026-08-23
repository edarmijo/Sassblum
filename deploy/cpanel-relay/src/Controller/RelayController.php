<?php

declare(strict_types=1);

namespace SassBlum\Relay\Controller;

use SassBlum\Relay\Exception\PayloadValidationException;
use SassBlum\Relay\Http\JsonResponse;
use SassBlum\Relay\Logging\AuditLogger;
use SassBlum\Relay\Mailer\RelayMailerInterface;
use SassBlum\Relay\Security\FileRateLimiter;
use SassBlum\Relay\Security\IdempotencyStore;
use SassBlum\Relay\Security\SecretAuthenticator;
use SassBlum\Relay\Validation\PayloadValidator;
use Throwable;

final class RelayController
{
    /** @var SecretAuthenticator */ private $authenticator;
    /** @var FileRateLimiter */ private $rateLimiter;
    /** @var PayloadValidator */ private $validator;
    /** @var IdempotencyStore */ private $idempotency;
    /** @var RelayMailerInterface */ private $mailer;
    /** @var AuditLogger */ private $logger;
    /** @var int */ private $maxPayloadBytes;

    public function __construct(
        SecretAuthenticator $authenticator,
        FileRateLimiter $rateLimiter,
        PayloadValidator $validator,
        IdempotencyStore $idempotency,
        RelayMailerInterface $mailer,
        AuditLogger $logger,
        int $maxPayloadBytes
    ) {
        $this->authenticator = $authenticator;
        $this->rateLimiter = $rateLimiter;
        $this->validator = $validator;
        $this->idempotency = $idempotency;
        $this->mailer = $mailer;
        $this->logger = $logger;
        $this->maxPayloadBytes = $maxPayloadBytes;
    }

    public function handle(
        string $method,
        string $contentType,
        string $providedSecret,
        string $rawBody,
        int $now
    ): JsonResponse {
        if (strtoupper($method) !== 'POST') {
            return new JsonResponse(405, ['status' => 'error'], ['Allow' => 'POST']);
        }
        if (strtolower(trim(explode(';', $contentType, 2)[0])) !== 'application/json') {
            return new JsonResponse(415, ['status' => 'error']);
        }
        if (!$this->authenticator->isAuthorized($providedSecret)) {
            return new JsonResponse(401, ['status' => 'error']);
        }
        if ($rawBody === '' || strlen($rawBody) > $this->maxPayloadBytes) {
            return new JsonResponse(413, ['status' => 'error']);
        }
        if (!$this->rateLimiter->consume($now)) {
            return new JsonResponse(429, ['status' => 'error'], ['Retry-After' => '60']);
        }

        try {
            $message = $this->validator->validate($rawBody);
        } catch (PayloadValidationException $exception) {
            return new JsonResponse(422, ['status' => 'error']);
        }

        if (!$this->idempotency->claim($message->messageId(), $now)) {
            return new JsonResponse(200, [
                'status' => 'duplicate',
                'message_id' => $message->messageId(),
            ]);
        }

        try {
            $providerCode = $this->mailer->send($message);
        } catch (Throwable $exception) {
            try {
                $this->idempotency->release($message->messageId());
            } catch (Throwable $releaseException) {
                error_log('SassBlum relay idempotency release failed.');
            }
            $this->recordSafely($message, 'failed', get_class($exception));
            return new JsonResponse(502, ['status' => 'error']);
        }

        try {
            $this->idempotency->markDelivered($message->messageId(), $now);
        } catch (Throwable $exception) {
            $this->recordSafely($message, 'failed', 'idempotency-persistence');
            return new JsonResponse(500, ['status' => 'error']);
        }
        $this->recordSafely($message, 'sent', $providerCode);
        return new JsonResponse(200, [
            'status' => 'sent',
            'message_id' => $message->messageId(),
        ]);
    }

    private function recordSafely(
        \SassBlum\Relay\Domain\RelayMessage $message,
        string $result,
        string $providerCode
    ): void {
        try {
            $this->logger->record($message, $result, $providerCode);
        } catch (Throwable $exception) {
            error_log('SassBlum relay audit logging failed.');
        }
    }
}
