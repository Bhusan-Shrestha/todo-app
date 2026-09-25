// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

// Base address of Alloy, without any path. Comes from backend/.env,
// with a fallback in case the variable is missing.
const otlpBase = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://alloy:4318';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'todo-backend',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${otlpBase}/v1/traces`,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();