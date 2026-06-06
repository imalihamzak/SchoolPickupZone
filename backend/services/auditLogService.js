const pool = require('../config/db');

const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'token',
  'resetToken',
  'stripe_webhook_secret',
  'stripe_secret_key',
  'secret',
  'card',
  'payment_method',
]);

const safeParseJson = (value) => {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return value;
  }
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    const normalizedKey = String(key).toLowerCase();
    if (SENSITIVE_KEYS.has(normalizedKey) || normalizedKey.includes('password') || normalizedKey.includes('secret')) {
      acc[key] = '[redacted]';
      return acc;
    }

    acc[key] = sanitizeValue(entryValue);
    return acc;
  }, {});
};

const safeStringify = (value) => {
  if (value === undefined) return null;
  try {
    return JSON.stringify(sanitizeValue(value));
  } catch (_err) {
    return JSON.stringify({ note: 'Unable to serialize audit metadata.' });
  }
};

const resolveActor = async (actorId, fallbackRole = null) => {
  if (!actorId) {
    return {
      actorId: null,
      actorRole: fallbackRole,
      actorEmail: null,
    };
  }

  try {
    const [[actor]] = await pool.execute(
      'SELECT id, role, email FROM users WHERE id = ?',
      [actorId]
    );

    return {
      actorId,
      actorRole: actor?.role || fallbackRole,
      actorEmail: actor?.email || null,
    };
  } catch (_err) {
    return {
      actorId,
      actorRole: fallbackRole,
      actorEmail: null,
    };
  }
};

const logAuditEvent = async ({
  actorId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  entityName = null,
  status = 'success',
  requestMethod = null,
  requestPath = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
  errorMessage = null,
}) => {
  if (!action || !entityType) return;

  const actor = await resolveActor(actorId, actorRole);

  try {
    await pool.execute(
      `INSERT INTO super_admin_audit_logs (
         actor_id,
         actor_role,
         actor_email,
         action,
         entity_type,
         entity_id,
         entity_name,
         status,
         request_method,
         request_path,
         ip_address,
         user_agent,
         metadata,
         error_message
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.actorId,
        actor.actorRole,
        actor.actorEmail,
        action,
        entityType,
        entityId === undefined ? null : entityId,
        entityName === undefined ? null : entityName,
        status,
        requestMethod,
        requestPath,
        ipAddress,
        userAgent,
        safeStringify(metadata),
        errorMessage ? String(errorMessage).slice(0, 1000) : null,
      ]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('Failed to write audit log:', err.message);
    }
  }
};

const getResponseMessage = (responseBody) => {
  const parsed = safeParseJson(responseBody);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed.error || parsed.message || null;
};

const auditAction = ({
  action,
  entityType,
  getAction,
  getEntityId,
  getEntityName,
  getMetadata,
} = {}) => (req, res, next) => {
  const startedAt = Date.now();
  let responseBody = null;

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (responseBody === null) responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    const resolvedAction = typeof getAction === 'function'
      ? getAction(req, responseBody)
      : action;
    const resolvedEntityType = typeof entityType === 'function'
      ? entityType(req, responseBody)
      : entityType;
    const status = res.statusCode < 400 ? 'success' : 'failed';

    const metadata = {
      params: sanitizeValue(req.params || {}),
      query: sanitizeValue(req.query || {}),
      body: sanitizeValue(req.body || {}),
      response: sanitizeValue(safeParseJson(responseBody)),
      durationMs: Date.now() - startedAt,
      ...(typeof getMetadata === 'function' ? sanitizeValue(getMetadata(req, responseBody) || {}) : {}),
    };

    logAuditEvent({
      actorId: req.user?.id || null,
      actorRole: req.user?.role || null,
      action: resolvedAction,
      entityType: resolvedEntityType,
      entityId: typeof getEntityId === 'function'
        ? getEntityId(req, responseBody)
        : req.params?.id || safeParseJson(responseBody)?.id || null,
      entityName: typeof getEntityName === 'function'
        ? getEntityName(req, responseBody)
        : req.body?.name || req.body?.email || safeParseJson(responseBody)?.name || null,
      status,
      requestMethod: req.method,
      requestPath: req.originalUrl,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      metadata,
      errorMessage: status === 'failed' ? getResponseMessage(responseBody) : null,
    });
  });

  next();
};

module.exports = {
  auditAction,
  logAuditEvent,
  sanitizeValue,
};
