/**
 * alert-rule.ts
 *
 * AlertRuleEvaluator: wires alert rule definitions to the AlertTransport.
 *
 * Rules are evaluated against incoming alert data (e.g. from the POST /alerts
 * Alertmanager webhook).  When a rule fires, the evaluator delivers
 * notifications through the configured AlertTransport.
 *
 * This module imports AlertPayload exclusively from alert-transport.ts –
 * the canonical single definition for this service.
 */

import { AlertPayload, AlertTransport, DeliveryResult } from './alert-transport';

// ---------------------------------------------------------------------------
// Rule definition types
// ---------------------------------------------------------------------------

export interface AlertRule {
  /** Unique rule identifier (matches AlertPayload.ruleId). */
  id: string;
  /** Human-readable description. */
  description: string;
  /** Severity assigned when this rule fires. */
  severity: AlertPayload['severity'];
  /**
   * Predicate applied to the raw alert body coming from Alertmanager.
   * Return true to fire this rule.
   */
  matches: (alert: AlertmanagerAlert) => boolean;
  /**
   * Builds the message that will appear in the notification.
   */
  buildMessage: (alert: AlertmanagerAlert) => string;
  /**
   * Builds the context key/value pairs for the notification.
   */
  buildContext: (alert: AlertmanagerAlert) => Record<string, string>;
}

// ---------------------------------------------------------------------------
// Alertmanager webhook payload shape (v4 API)
// ---------------------------------------------------------------------------

export interface AlertmanagerAlert {
  status: 'firing' | 'resolved';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt?: string;
  generatorURL?: string;
  fingerprint?: string;
}

export interface AlertmanagerWebhookPayload {
  version: string;
  groupKey: string;
  status: 'firing' | 'resolved';
  receiver: string;
  groupLabels: Record<string, string>;
  commonLabels: Record<string, string>;
  commonAnnotations: Record<string, string>;
  externalURL: string;
  alerts: AlertmanagerAlert[];
}

// ---------------------------------------------------------------------------
// EvaluationResult
// ---------------------------------------------------------------------------

export interface EvaluationResult {
  ruleId: string;
  fired: boolean;
  payload?: AlertPayload;
  deliveryResults?: DeliveryResult[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Default built-in rules
// ---------------------------------------------------------------------------

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'high-error-rate',
    description: 'Fires when error rate exceeds threshold',
    severity: 'critical',
    matches: (a) =>
      (a.labels['alertname'] === 'HighErrorRate' || a.labels['alertname'] === 'ErrorRateHigh') &&
      a.status === 'firing',
    buildMessage: (a) =>
      a.annotations['description'] ||
      `High error rate detected on ${a.labels['service'] ?? 'unknown service'}`,
    buildContext: (a) => ({
      service: a.labels['service'] ?? '',
      instance: a.labels['instance'] ?? '',
      environment: a.labels['environment'] ?? '',
      ...(a.annotations['runbook_url'] ? { runbook: a.annotations['runbook_url'] } : {}),
    }),
  },
  {
    id: 'service-down',
    description: 'Fires when a monitored service is unavailable',
    severity: 'critical',
    matches: (a) =>
      (a.labels['alertname'] === 'ServiceDown' || a.labels['alertname'] === 'InstanceDown') &&
      a.status === 'firing',
    buildMessage: (a) =>
      a.annotations['description'] ||
      `Service ${a.labels['service'] ?? a.labels['instance'] ?? 'unknown'} is down`,
    buildContext: (a) => ({
      service: a.labels['service'] ?? '',
      instance: a.labels['instance'] ?? '',
      job: a.labels['job'] ?? '',
    }),
  },
  {
    id: 'high-latency',
    description: 'Fires when p99 latency exceeds the configured SLO',
    severity: 'warning',
    matches: (a) =>
      (a.labels['alertname'] === 'HighLatency' || a.labels['alertname'] === 'SlowRequests') &&
      a.status === 'firing',
    buildMessage: (a) =>
      a.annotations['description'] ||
      `High latency detected on ${a.labels['service'] ?? 'unknown service'}`,
    buildContext: (a) => ({
      service: a.labels['service'] ?? '',
      quantile: a.labels['quantile'] ?? 'p99',
    }),
  },
  {
    id: 'disk-space-low',
    description: 'Fires when disk free space falls below threshold',
    severity: 'warning',
    matches: (a) =>
      a.labels['alertname'] === 'DiskSpaceLow' && a.status === 'firing',
    buildMessage: (a) =>
      a.annotations['description'] || `Low disk space on ${a.labels['instance'] ?? 'unknown'}`,
    buildContext: (a) => ({
      instance: a.labels['instance'] ?? '',
      mountpoint: a.labels['mountpoint'] ?? '/',
    }),
  },
  {
    id: 'catch-all-critical',
    description: 'Catch-all for any critical severity alert not matched by a specific rule',
    severity: 'critical',
    matches: (a) => a.labels['severity'] === 'critical' && a.status === 'firing',
    buildMessage: (a) =>
      a.annotations['description'] ||
      a.annotations['summary'] ||
      `Critical alert: ${a.labels['alertname'] ?? 'unknown'}`,
    buildContext: (a) => ({
      alertname: a.labels['alertname'] ?? '',
      ...a.labels,
    }),
  },
];

// ---------------------------------------------------------------------------
// AlertRuleEvaluator
// ---------------------------------------------------------------------------

export class AlertRuleEvaluator {
  private readonly rules: AlertRule[];
  private readonly transport: AlertTransport | null;

  constructor(transport: AlertTransport | null, extraRules: AlertRule[] = []) {
    this.transport = transport;
    // User-supplied rules take precedence (checked first); built-in rules act
    // as safe defaults.
    this.rules = [...extraRules, ...DEFAULT_RULES];
  }

  /**
   * Evaluate all alerts inside an Alertmanager webhook payload.
   * Each alert is tested against every rule; the first matching rule fires.
   */
  async evaluate(webhookPayload: AlertmanagerWebhookPayload): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (const alert of webhookPayload.alerts) {
      const result = await this._evaluateAlert(alert);
      results.push(...result);
    }

    return results;
  }

  /**
   * Evaluate a single raw alert against all rules.
   */
  async evaluateAlert(alert: AlertmanagerAlert): Promise<EvaluationResult[]> {
    return this._evaluateAlert(alert);
  }

  // -------------------------------------------------------------------------

  private async _evaluateAlert(alert: AlertmanagerAlert): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (const rule of this.rules) {
      let fired = false;
      try {
        fired = rule.matches(alert);
      } catch (err) {
        results.push({
          ruleId: rule.id,
          fired: false,
          error: `Rule.matches() threw: ${err instanceof Error ? err.message : String(err)}`,
        });
        continue;
      }

      if (!fired) {
        results.push({ ruleId: rule.id, fired: false });
        continue;
      }

      const payload: AlertPayload = {
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.buildMessage(alert),
        context: rule.buildContext(alert),
        timestamp: alert.startsAt || new Date().toISOString(),
      };

      if (!this.transport) {
        console.warn(
          `[AlertRuleEvaluator] Rule "${rule.id}" fired but no transport is configured. ` +
            'Alert payload logged only.',
          payload,
        );
        results.push({ ruleId: rule.id, fired: true, payload });
        continue;
      }

      try {
        const deliveryResults = await this.transport.send(payload);
        results.push({ ruleId: rule.id, fired: true, payload, deliveryResults });
      } catch (err) {
        results.push({
          ruleId: rule.id,
          fired: true,
          payload,
          error: `Delivery failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return results;
  }

  /**
   * Return the list of registered rule IDs (useful for diagnostics/tests).
   */
  getRuleIds(): string[] {
    return this.rules.map((r) => r.id);
  }
}
