<?php

declare(strict_types=1);

namespace SassBlum\Relay\Validation;

use JsonException;
use SassBlum\Relay\Domain\RelayMessage;
use SassBlum\Relay\Exception\PayloadValidationException;

final class PayloadValidator
{
    private const REQUIRED_KEYS = [
        'version',
        'message_id',
        'subject',
        'to',
        'cc',
        'reply_to',
        'text_body',
        'html_body',
    ];
    private const MAX_RECIPIENTS = 50;
    private const MAX_SUBJECT_CHARS = 998;

    /** @var int */
    private $maxPayloadBytes;

    public function __construct(int $maxPayloadBytes)
    {
        if ($maxPayloadBytes <= 0) {
            throw new PayloadValidationException('Invalid payload limit.');
        }
        $this->maxPayloadBytes = $maxPayloadBytes;
    }

    public function validate(string $rawBody): RelayMessage
    {
        if ($rawBody === '' || strlen($rawBody) > $this->maxPayloadBytes) {
            throw new PayloadValidationException('Payload size is invalid.');
        }
        try {
            $payload = json_decode($rawBody, true, 16, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new PayloadValidationException('Payload is not valid JSON.', 0, $exception);
        }
        if (!is_array($payload) || !$this->hasExactFields($payload)) {
            throw new PayloadValidationException('Payload fields are invalid.');
        }
        if ($payload['version'] !== 1) {
            throw new PayloadValidationException('Payload version is unsupported.');
        }

        $messageId = $this->requiredString($payload['message_id']);
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $messageId) !== 1) {
            throw new PayloadValidationException('Message identifier is invalid.');
        }
        $subject = trim($this->requiredString($payload['subject']));
        if ($subject === '' || mb_strlen($subject, 'UTF-8') > self::MAX_SUBJECT_CHARS || preg_match('/[\r\n]/', $subject) === 1) {
            throw new PayloadValidationException('Subject is invalid.');
        }

        $to = $this->emailList($payload['to'], true);
        $cc = $this->emailList($payload['cc'], false);
        $replyTo = $this->emailList($payload['reply_to'], false);
        if (count($to) + count($cc) + count($replyTo) > self::MAX_RECIPIENTS) {
            throw new PayloadValidationException('Recipient limit exceeded.');
        }

        $textBody = $this->stringValue($payload['text_body']);
        $htmlBody = $this->stringValue($payload['html_body']);
        if ($textBody === '' && $htmlBody === '') {
            throw new PayloadValidationException('Message body is empty.');
        }
        return new RelayMessage($messageId, $subject, $to, $cc, $replyTo, $textBody, $htmlBody);
    }

    /** @param array<mixed> $payload */
    private function hasExactFields(array $payload): bool
    {
        $actual = array_keys($payload);
        $expected = self::REQUIRED_KEYS;
        sort($actual, SORT_STRING);
        sort($expected, SORT_STRING);
        return $actual === $expected;
    }

    /** @param mixed $value */
    private function requiredString($value): string
    {
        if (!is_string($value) || $value === '') {
            throw new PayloadValidationException('Required string is invalid.');
        }
        return $value;
    }

    /** @param mixed $value */
    private function stringValue($value): string
    {
        if (!is_string($value)) {
            throw new PayloadValidationException('String field is invalid.');
        }
        return $value;
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private function emailList($value, bool $required): array
    {
        if (!is_array($value) || ($required && count($value) === 0)) {
            throw new PayloadValidationException('Recipient list is invalid.');
        }
        $normalized = [];
        foreach ($value as $address) {
            if (!is_string($address) || preg_match('/[\r\n]/', $address) === 1 || filter_var($address, FILTER_VALIDATE_EMAIL) === false) {
                throw new PayloadValidationException('Recipient address is invalid.');
            }
            $key = strtolower($address);
            if (isset($normalized[$key])) {
                throw new PayloadValidationException('Recipient list contains duplicates.');
            }
            $normalized[$key] = $address;
        }
        return array_values($normalized);
    }
}
