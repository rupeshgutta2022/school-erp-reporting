// Distributed request tracing and correlation ID middleware
const crypto = require('crypto');

function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

function logTelemetry(req, eventName, payload = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId || 'system',
    event: eventName,
    path: req.originalUrl,
    method: req.method,
    ...payload
  };
  console.log(JSON.stringify(logEntry));
}

module.exports = { correlationMiddleware, logTelemetry };
