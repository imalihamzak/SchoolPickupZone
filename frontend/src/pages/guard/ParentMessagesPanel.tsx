import { useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Phone,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toast";
import { LAN_API_BASE } from "@/lib/api/link";

type ParentGuardMessage = {
  id: number;
  parentName: string;
  parentPhone?: string | null;
  pickupId?: number | null;
  messageType: string;
  messageTypeLabel: string;
  message: string;
  childrenSummary: string;
  vehicleSummary: string;
  acknowledged: boolean;
  acknowledgedAt?: string | null;
  acknowledgedByName?: string | null;
  createdAt?: string | null;
};

const PARENT_MESSAGES_CSS = `
.pz-guard-parent-messages {
  --navy: #071D3B;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --teal-pale: #E1F5EE;
  --amber: #EF9F27;
  --amber-pale: #FEF3DC;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 16px 42px rgba(7,29,59,0.08);
  overflow: hidden;
  color: var(--text-1);
  font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;
}

.pz-guard-parent-messages,
.pz-guard-parent-messages * {
  box-sizing: border-box;
}

.pz-guard-parent-messages-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.pz-guard-parent-messages-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pz-guard-parent-messages-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--teal-pale);
  color: var(--teal);
  flex: 0 0 auto;
}

.pz-guard-parent-messages-title {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.1;
}

.pz-guard-parent-messages-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 11px;
  font-weight: 700;
}

.pz-guard-parent-messages-refresh {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-guard-parent-messages-refresh:hover:not(:disabled) {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-guard-parent-messages-refresh:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.pz-guard-parent-messages-body {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.pz-guard-parent-message-empty,
.pz-guard-parent-message-error {
  border: 1px dashed #CAD2DF;
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-3);
  padding: 14px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 800;
}

.pz-guard-parent-message-error {
  border-style: solid;
  border-color: rgba(226,75,74,0.24);
  background: #FDEAEA;
  color: #991B1B;
}

.pz-guard-parent-message-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FBFCFE;
  padding: 13px;
  display: grid;
  gap: 11px;
}

.pz-guard-parent-message-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pz-guard-parent-message-parent {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
}

.pz-guard-parent-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--navy);
  color: var(--white);
  flex: 0 0 auto;
}

.pz-guard-parent-message-name {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.pz-guard-parent-message-meta {
  margin-top: 3px;
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
}

.pz-guard-parent-message-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: var(--amber-pale);
  color: #92400E;
  padding: 5px 8px;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}

.pz-guard-parent-message-text {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.pz-guard-parent-message-info {
  display: grid;
  gap: 8px;
}

.pz-guard-parent-message-info-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  color: var(--text-3);
  font-size: 11px;
  line-height: 1.45;
}

.pz-guard-parent-message-info-row svg {
  margin-top: 1px;
  color: var(--teal);
}

.pz-guard-parent-message-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}

.pz-guard-parent-message-status {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
}

.pz-guard-parent-message-ack {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--teal);
  border-radius: 10px;
  background: var(--teal);
  color: var(--white);
  padding: 0 11px;
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.pz-guard-parent-message-ack:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}
`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function ParentMessagesPanel() {
  const [messages, setMessages] = useState<ParentGuardMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  const unacknowledgedCount = useMemo(
    () => messages.filter((message) => !message.acknowledged).length,
    [messages]
  );

  const fetchMessages = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`${LAN_API_BASE}/parent-guard-messages?limit=8`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load parent messages.");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load parent messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = window.setInterval(() => fetchMessages({ silent: true }), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const acknowledgeMessage = async (messageId: number) => {
    setAcknowledgingId(messageId);
    try {
      const response = await fetch(`${LAN_API_BASE}/parent-guard-messages/${messageId}/acknowledge`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to acknowledge message.");
      toast.success(data.message || "Pickup team message acknowledged.");
      await fetchMessages({ silent: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge message.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <section className="pz-guard-parent-messages">
      <style>{PARENT_MESSAGES_CSS}</style>
      <div className="pz-guard-parent-messages-head">
        <div className="pz-guard-parent-messages-title-row">
          <div className="pz-guard-parent-messages-icon">
            <MessageSquareText size={18} aria-hidden="true" />
          </div>
          <div>
            <div className="pz-guard-parent-messages-title">Parent Messages</div>
            <div className="pz-guard-parent-messages-subtitle">
              {unacknowledgedCount ? `${unacknowledgedCount} needs acknowledgement` : "Pickup notes from families"}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="pz-guard-parent-messages-refresh"
          onClick={() => fetchMessages({ silent: true })}
          disabled={loading || refreshing}
          aria-label="Refresh parent messages"
        >
          {refreshing ? (
            <LoadingSpinner size="xs" className="pz-loading-inline" />
          ) : (
            <RefreshCw size={15} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="pz-guard-parent-messages-body">
        {loading ? (
          <div className="pz-guard-parent-message-empty">
            <LoadingSpinner size="sm" label="Loading parent messages" />
          </div>
        ) : error ? (
          <div className="pz-guard-parent-message-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="pz-guard-parent-message-empty">No parent pickup messages for today.</div>
        ) : (
          messages.map((message) => (
            <article className="pz-guard-parent-message-card" key={message.id}>
              <div className="pz-guard-parent-message-top">
                <div className="pz-guard-parent-message-parent">
                  <div className="pz-guard-parent-message-avatar">
                    <UserRound size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-guard-parent-message-name">{message.parentName}</div>
                    <div className="pz-guard-parent-message-meta">
                      {formatMessageTime(message.createdAt)}
                      {message.pickupId ? ` / Request #${message.pickupId}` : ""}
                    </div>
                  </div>
                </div>
                <span className="pz-guard-parent-message-pill">
                  <Clock3 size={12} aria-hidden="true" />
                  {message.messageTypeLabel}
                </span>
              </div>

              <div className="pz-guard-parent-message-text">
                {message.message || message.messageTypeLabel}
              </div>

              <div className="pz-guard-parent-message-info">
                <div className="pz-guard-parent-message-info-row">
                  <UsersRound size={14} aria-hidden="true" />
                  <span>{message.childrenSummary}</span>
                </div>
                {message.parentPhone && (
                  <div className="pz-guard-parent-message-info-row">
                    <Phone size={14} aria-hidden="true" />
                    <span>{message.parentPhone}</span>
                  </div>
                )}
                <div className="pz-guard-parent-message-info-row">
                  <Car size={14} aria-hidden="true" />
                  <span>{message.vehicleSummary}</span>
                </div>
              </div>

              <div className="pz-guard-parent-message-actions">
                <div className="pz-guard-parent-message-status">
                  {message.acknowledged
                    ? `Acknowledged${message.acknowledgedByName ? ` by ${message.acknowledgedByName}` : ""}`
                    : "Waiting for guard acknowledgement"}
                </div>
                {!message.acknowledged && (
                  <button
                    type="button"
                    className="pz-guard-parent-message-ack"
                    onClick={() => acknowledgeMessage(message.id)}
                    disabled={acknowledgingId === message.id}
                  >
                    {acknowledgingId === message.id ? (
                      <LoadingSpinner size="xs" className="pz-loading-inline" />
                    ) : (
                      <CheckCircle2 size={15} aria-hidden="true" />
                    )}
                    Acknowledge
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatMessageTime(value?: string | null) {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
