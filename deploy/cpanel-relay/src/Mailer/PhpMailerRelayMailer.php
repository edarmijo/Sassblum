<?php

declare(strict_types=1);

namespace SassBlum\Relay\Mailer;

use PHPMailer\PHPMailer\Exception as PhpMailerException;
use PHPMailer\PHPMailer\PHPMailer;
use SassBlum\Relay\Config\RelayConfig;
use SassBlum\Relay\Domain\RelayMessage;
use SassBlum\Relay\Exception\RelayException;

final class PhpMailerRelayMailer implements RelayMailerInterface
{
    /** @var RelayConfig */
    private $config;

    public function __construct(RelayConfig $config)
    {
        $this->config = $config;
    }

    public function send(RelayMessage $message): string
    {
        $mailer = new PHPMailer(true);
        try {
            $mailer->isSMTP();
            $mailer->Host = $this->config->smtpHost();
            $mailer->Port = $this->config->smtpPort();
            $mailer->SMTPAuth = true;
            $mailer->Username = $this->config->smtpUsername();
            $mailer->Password = $this->config->smtpPassword();
            $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mailer->Timeout = $this->config->smtpTimeout();
            $mailer->CharSet = PHPMailer::CHARSET_UTF8;
            $mailer->SMTPAutoTLS = true;
            $mailer->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false,
                ],
            ];

            $mailer->setFrom($this->config->senderEmail(), $this->config->senderName(), false);
            foreach ($message->to() as $address) {
                $mailer->addAddress($address);
            }
            foreach ($message->cc() as $address) {
                $mailer->addCC($address);
            }
            foreach ($message->replyTo() as $address) {
                $mailer->addReplyTo($address);
            }

            $mailer->Subject = $message->subject();
            if ($message->htmlBody() !== '') {
                $mailer->isHTML(true);
                $mailer->Body = $message->htmlBody();
                $mailer->AltBody = $message->textBody();
            } else {
                $mailer->isHTML(false);
                $mailer->Body = $message->textBody();
            }
            $mailer->send();
            return 'smtp-accepted';
        } catch (PhpMailerException $exception) {
            throw new RelayException('SMTP delivery failed.', 0, $exception);
        }
    }
}
