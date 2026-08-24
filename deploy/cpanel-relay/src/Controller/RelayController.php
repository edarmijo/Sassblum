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
        $perimeterRejection = $this->perimeterRejection(
            $method,
            $contentType,
            $providedSecret,
            $rawBody,
            $now
        );
        if ($perimeterRejection !== null) {
            return $perimeterRejection;
        }

        try {
            $message = $this->validator->validate($rawBody);
        } catch (PayloadValidationException $exception) {
            return new JsonResponse(422, ['status' => 'error']);
        }

        return $this->deliverValidated($message, $now);
    }

    private function perimeterRejection(
        string $method,
        string $contentType,
        string $providedSecret,
        string $rawBody,
        int $now
    ): ?JsonResponse {
        $rejection = null;
        if (strtoupper($method) !== 'POST') {
            $rejection = new JsonResponse(405, ['status' => 'error'], ['Allow' => 'POST']);
        } elseif (strtolower(trim(explode(';', $contentType, 2)[0])) !== 'application/json') {
            $rejection = new JsonResponse(415, ['status' => 'error']);
        } elseif (!$this->authenticator->isAuthorized($providedSecret)) {
            $rejection = new JsonResponse(401, ['status' => 'error']);
        } elseif ($rawBody === '' || strlen($rawBody) > $this->maxPayloadBytes) {
            $rejection = new JsonResponse(413, ['status' => 'error']);
        } elseif (!$this->rateLimiter->consume($now)) {
            $rejection = new JsonResponse(429, ['status' => 'error'], ['Retry-After' => '60']);
        }
        return $rejection;
    }

    private function deliverValidated(
        \SassBlum\Relay\Domain\RelayMessage $message,
        int $now
    ): JsonResponse {
        if (!$this->idempotency->claim($message->messageId(), $now)) {
            return new JsonResponse(200, [
                'status' => 'duplicate',
                'message_id' => $message->messageId(),
            ]);
        }

        return $this->sendClaimedMessage($message, $now);
    }

    private function sendClaimedMessage(
        \SassBlum\Relay\Domain\RelayMessage $message,
        int $now
    ): JsonResponse {
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
