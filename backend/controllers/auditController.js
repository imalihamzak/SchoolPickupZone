const pool = require('../config/db');

const normalizeLimit = (value) => {
  const parsed = Number(value || 200);
  if (!Number.isFinite(parsed)) return 200;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
};

exports.getSuperAdminAuditLogs = async (req, res) => {
  try {
    const filters = [];
    const params = [];
    const {
      status,
      action,
      entity_type,
      search,
      from,
      to,
    } = req.query;

    if (status && status !== 'all') {
      filters.push('status = ?');
      params.push(status);
    }

    if (action && action !== 'all') {
      filters.push('action = ?');
      params.push(action);
    }

    if (entity_type && entity_type !== 'all') {
      filters.push('entity_type = ?');
      params.push(entity_type);
    }

    if (from) {
      filters.push('created_at >= ?');
      params.push(from);
    }

    if (to) {
      filters.push('created_at <= ?');
      params.push(to);
    }

    if (search) {
      const like = `%${search}%`;
      filters.push(`(
        action LIKE ?
        OR entity_type LIKE ?
        OR entity_id LIKE ?
        OR entity_name LIKE ?
        OR actor_email LIKE ?
        OR request_path LIKE ?
      )`);
      params.push(like, like, like, like, like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    params.push(normalizeLimit(req.query.limit));

    const [rows] = await pool.query(
      `SELECT
         id,
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
         error_message,
         created_at
       FROM super_admin_audit_logs
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      params
    );

    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'success') AS successful,
         SUM(status = 'failed') AS failed,
         COUNT(DISTINCT actor_id) AS actors
       FROM super_admin_audit_logs`
    );

    res.json({
      logs: rows.map((row) => ({
        ...row,
        metadata: parseMetadata(row.metadata),
      })),
      summary: {
        total: Number(summary?.total || 0),
        successful: Number(summary?.successful || 0),
        failed: Number(summary?.failed || 0),
        actors: Number(summary?.actors || 0),
      },
    });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        logs: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          actors: 0,
        },
      });
    }

    console.error('Failed to load Super Admin audit logs:', err.message);
    res.status(500).json({ error: 'Failed to load audit logs.' });
  }
};

function parseMetadata(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return null;
  }
}
