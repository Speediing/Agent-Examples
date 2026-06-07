export type ServiceHealth = {
  service: string;
  status: "healthy" | "degraded" | "critical";
  error_rate_percent: number;
  latency_p99_ms: number;
  request_rate_per_min: number;
  db_connection_pool_used_percent: number;
  notes: string[];
};

export type Deployment = {
  service: string;
  commit: string;
  author: string;
  deployed_at: string;
  summary: string;
};

export type Alert = {
  id: string;
  service: string;
  severity: "warning" | "critical";
  fired_at: string;
  message: string;
  resolved: boolean;
};

export type Runbook = {
  symptom: string;
  steps: string[];
  escalation: string;
};

export const SERVICE_HEALTH: Record<string, ServiceHealth> = {
  "checkout-api": {
    service: "checkout-api",
    status: "critical",
    error_rate_percent: 18.2,
    latency_p99_ms: 1240,
    request_rate_per_min: 420,
    db_connection_pool_used_percent: 96,
    notes: [
      "503 responses spiked after the latest deploy",
      "Connection pool saturation correlates with checkout failures"
    ]
  },
  "payments-worker": {
    service: "payments-worker",
    status: "degraded",
    error_rate_percent: 4.1,
    latency_p99_ms: 680,
    request_rate_per_min: 95,
    db_connection_pool_used_percent: 72,
    notes: ["Retry queue depth is elevated but draining"]
  },
  "catalog-api": {
    service: "catalog-api",
    status: "healthy",
    error_rate_percent: 0.3,
    latency_p99_ms: 120,
    request_rate_per_min: 880,
    db_connection_pool_used_percent: 41,
    notes: ["No active incident signals"]
  }
};

export const RECENT_DEPLOYMENTS: Deployment[] = [
  {
    service: "checkout-api",
    commit: "a91f2c1",
    author: "morgan",
    deployed_at: "2026-06-07T14:22:00Z",
    summary: "Increase checkout worker concurrency and shrink DB pool size"
  },
  {
    service: "payments-worker",
    commit: "d04be88",
    author: "lee",
    deployed_at: "2026-06-07T11:05:00Z",
    summary: "Tune retry backoff for card processor timeouts"
  },
  {
    service: "catalog-api",
    commit: "77ac010",
    author: "sam",
    deployed_at: "2026-06-06T18:40:00Z",
    summary: "Cache warming for category pages"
  }
];

export const ALERTS: Alert[] = [
  {
    id: "alert-4412",
    service: "checkout-api",
    severity: "critical",
    fired_at: "2026-06-07T14:31:00Z",
    message: "HTTP 5xx rate above 15% for checkout-api",
    resolved: false
  },
  {
    id: "alert-4410",
    service: "checkout-api",
    severity: "warning",
    fired_at: "2026-06-07T14:28:00Z",
    message: "p99 latency above 900ms for checkout-api",
    resolved: false
  },
  {
    id: "alert-4398",
    service: "payments-worker",
    severity: "warning",
    fired_at: "2026-06-07T12:10:00Z",
    message: "Retry queue depth above baseline",
    resolved: true
  }
];

export const ERROR_LOGS: Record<string, string[]> = {
  "checkout-api": [
    "2026-06-07T14:31:12Z ERROR pool exhausted waiting for checkout-db connection",
    "2026-06-07T14:31:14Z ERROR request failed status=503 route=/v1/checkout",
    "2026-06-07T14:31:19Z ERROR circuit breaker open for checkout-db"
  ],
  "payments-worker": [
    "2026-06-07T12:11:03Z WARN retrying card capture attempt=3 processor=stripe"
  ]
};

export const METRIC_SAMPLES: Record<string, number> = {
  'rate(http_requests_total{service="checkout-api",status=~"5.."}[5m])': 18.2,
  'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="checkout-api"}[5m]))':
    1.24,
  'avg(db_connection_pool_used_percent{service="checkout-api"})': 96,
  'rate(http_requests_total{service="payments-worker",status=~"5.."}[5m])': 4.1
};

export const RUNBOOKS: Runbook[] = [
  {
    symptom: "checkout 503",
    steps: [
      "Confirm error rate and latency with get_service_health",
      "Check for a deploy within 30 minutes via get_recent_deployments",
      "Inspect connection pool saturation in metrics and error logs",
      "If pool size changed in the latest deploy, prepare a rollback or pool-size hotfix"
    ],
    escalation: "Page checkout on-call if error rate stays above 10% for 10 minutes"
  },
  {
    symptom: "database connection pool exhausted",
    steps: [
      "Validate pool utilization with query_metrics",
      "Compare current config against the previous deploy",
      "Scale pool size or reduce worker concurrency",
      "Verify recovery with get_service_health after the change"
    ],
    escalation: "Escalate to database platform if pool cannot be increased safely"
  }
];
