/**
 * alert-transport.ts
 *
 * Canonical AlertPayload type and AlertTransport implementation for
 * the monitoring-service alert pipeline.
 *
 * This is the single source of truth for alert notification delivery.
 * There must be NO other AlertPayload definition in this service.
 *
 * Replaces the MockTransport singletons that were previously in notifier.ts.
 */

import axios, { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Canonical AlertPayload – the only AlertPayload in this service.
// Every code path that sends an alert notification must use this type.
// ---------------------------------------------------------------------------

export interface AlertPayload {
  /** Identifier of the rule that fired. */
  ruleId: string;
  /** Normalised severity matching Alertmanager/Prometheus conventions. */
  severity: 'critical' | 'warning' | 'info';
  /** Human-readable description of the condition. */
  message: string;
  /** Arbitrary key/value context (labels, annotations, etc.) */
  context: Record<string, string>;
  /** ISO-8601 timestamp of when the alert fired. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Channel discriminated-union – callers pick the delivery mechanism.
// ---------------------------------------------------------------------------

export type AlertChannel =
  | { type: 'webhook'; url: string; headers?: Record<string, string> }
  | { type: 'slack'; webhookUrl: string }
  | { type: 'email'; smtpEndpoint: string; to: string; from: string };

export interface AlertTransportConfig {
  channels: AlertChannel[];
  /** Optional timeout in milliseconds per delivery attempt (default 5000). */
  timeoutMs?: number;
}

export interface DeliveryResult {
  channel: AlertChannel['type'];
  success: boolean;
  statusCode?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// AlertTransport – performs real HTTP delivery over configured channels.
// ---------------------------------------------------------------------------

export class AlertTransport {
  private readonly http: AxiosInstance;
  private readonly config: AlertTransportConfig;

  constructor(config: AlertTransportConfig) {
    this.config = config;
    this.http = axios.create({
      timeout: config.timeoutMs ?? 5_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send an alert payload over all configured channels.
   * Failures on individual channels are captured and returned; a single
   * channel failure never prevents delivery to the remaining channels.
   */
  async send(payload: AlertPayload): Promise<DeliveryResult[]> {
    const results = await Promise.all(
      this.config.channels.map((channel) => this._deliver(channel, payload)),
    );
    return results;
  }

  // -------------------------------------------------------------------------
  // Private delivery helpers
  // -------------------------------------------------------------------------

  private async _deliver(channel: AlertChannel, payload: AlertPayload): Promise<DeliveryResult> {
    try {
      switch (channel.type) {
        case 'webhook':
          return await this._deliverWebhook(channel, payload);
        case 'slack':
          return await this._deliverSlack(channel, payload);
        case 'email':
          return await this._deliverEmail(channel, payload);
        default: {
          // Exhaustiveness check – TypeScript will catch missing cases at
          // compile time, but we guard at runtime too.
          const _exhaustive: never = channel;
          return {
            channel: (_exhaustive as AlertChannel).type,
            success: false,
            error: `Unknown channel type: ${(_exhaustive as AlertChannel).type}`,
          };
        }
      }
    } catch (err) {
      return {
        channel: channel.type,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async _deliverWebhook(
    channel: Extract<AlertChannel, { type: 'webhook' }>,
    payload: AlertPayload,
  ): Promise<DeliveryResult> {
    const response = await this.http.post(channel.url, payload, {
      headers: channel.headers ?? {},
    });
    return {
      channel: 'webhook',
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
    };
  }

  private async _deliverSlack(
    channel: Extract<AlertChannel, { type: 'slack' }>,
    payload: AlertPayload,
  ): Promise<DeliveryResult> {
    const severityEmoji: Record<AlertPayload['severity'], string> = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const body = {
      text: `${severityEmoji[payload.severity]} *[${payload.ruleId}]* ${payload.message}`,
      attachments: [
        {
          color: payload.severity === 'critical' ? 'danger' : payload.severity === 'warning' ? 'warning' : 'good',
          fields: Object.entries(payload.context).map(([title, value]) => ({
            title,
            value,
            short: true,
          })),
          footer: `Fund My Cause Monitoring | ${payload.timestamp}`,
        },
      ],
    };

    const response = await this.http.post(channel.webhookUrl, body);
    return {
      channel: 'slack',
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
    };
  }

  /**
   * Email delivery via a lightweight SMTP-over-HTTP gateway (e.g. Mailhog,
   * SendGrid compatible endpoint).  The caller provides the endpoint URL and
   * addressing; TLS is enforced by the HTTP client.
   */
  private async _deliverEmail(
    channel: Extract<AlertChannel, { type: 'email' }>,
    payload: AlertPayload,
  ): Promise<DeliveryResult> {
    const body = {
      from: channel.from,
      to: channel.to,
      subject: `[${payload.severity.toUpperCase()}] ${payload.ruleId}: ${payload.message}`,
      text: [
        `Alert: ${payload.ruleId}`,
        `Severity: ${payload.severity}`,
        `Time: ${payload.timestamp}`,
        `Message: ${payload.message}`,
        '',
        'Context:',
        ...Object.entries(payload.context).map(([k, v]) => `  ${k}: ${v}`),
      ].join('\n'),
    };

    const response = await this.http.post(channel.smtpEndpoint, body);
    return {
      channel: 'email',
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
    };
  }
}

// ---------------------------------------------------------------------------
// Factory – constructs a transport from environment variables so that
// index.ts stays free of configuration details.
// ---------------------------------------------------------------------------

/**
 * Build an AlertTransport from well-known environment variables.
 *
 * Required for real operation:
 *   ALERT_WEBHOOK_URL   – POST target (e.g. the Alertmanager receiver URL)
 *
 * Optional extra channels:
 *   SLACK_WEBHOOK_URL   – Slack incoming webhook
 *   EMAIL_SMTP_ENDPOINT – HTTP email relay endpoint
 *   EMAIL_FROM          – Sender address
 *   EMAIL_TO            – Recipient address
 *
 * Returns null when no channels are configured (startup warning is emitted).
 */
export function buildAlertTransportFromEnv(): AlertTransport | null {
  const channels: AlertChannel[] = [];

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    channels.push({ type: 'webhook', url: webhookUrl });
  }

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    channels.push({ type: 'slack', webhookUrl: slackUrl });
  }

  const smtpEndpoint = process.env.EMAIL_SMTP_ENDPOINT;
  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.EMAIL_TO;
  if (smtpEndpoint && emailFrom && emailTo) {
    channels.push({ type: 'email', smtpEndpoint, from: emailFrom, to: emailTo });
  }

  if (channels.length === 0) {
    console.warn(
      '[AlertTransport] No notification channels configured. ' +
        'Set ALERT_WEBHOOK_URL, SLACK_WEBHOOK_URL, or EMAIL_* env vars.',
    );
    return null;
  }

  return new AlertTransport({ channels });
}
