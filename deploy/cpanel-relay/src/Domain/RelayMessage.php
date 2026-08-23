<?php

declare(strict_types=1);

namespace SassBlum\Relay\Domain;

final class RelayMessage
{
    /** @var string */ private $messageId;
    /** @var string */ private $subject;
    /** @var list<string> */ private $to;
    /** @var list<string> */ private $cc;
    /** @var list<string> */ private $replyTo;
    /** @var string */ private $textBody;
    /** @var string */ private $htmlBody;

    /**
     * @param list<string> $to
     * @param list<string> $cc
     * @param list<string> $replyTo
     */
    public function __construct(
        string $messageId,
        string $subject,
        array $to,
        array $cc,
        array $replyTo,
        string $textBody,
        string $htmlBody
    ) {
        $this->messageId = $messageId;
        $this->subject = $subject;
        $this->to = $to;
        $this->cc = $cc;
        $this->replyTo = $replyTo;
        $this->textBody = $textBody;
        $this->htmlBody = $htmlBody;
    }

    public function messageId(): string { return $this->messageId; }
    public function subject(): string { return $this->subject; }
    /** @return list<string> */ public function to(): array { return $this->to; }
    /** @return list<string> */ public function cc(): array { return $this->cc; }
    /** @return list<string> */ public function replyTo(): array { return $this->replyTo; }
    public function textBody(): string { return $this->textBody; }
    public function htmlBody(): string { return $this->htmlBody; }

    public function recipientHash(): string
    {
        $recipients = array_merge($this->to, $this->cc);
        sort($recipients, SORT_STRING);
        return hash('sha256', implode('|', array_map('strtolower', $recipients)));
    }
}
