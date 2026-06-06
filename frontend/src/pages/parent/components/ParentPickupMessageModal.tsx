import type { FormEvent } from "react";
import { useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Car,
  Clock3,
  HelpCircle,
  MessageSquareText,
  Send,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ParentModalPortal from "./ParentModalPortal";
import { API_BASE_URL } from "@/lib/api/link";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type MessageType = "running_late" | "car_line_issue" | "need_assistance" | "other";

type Props = {
  isOpen: boolean;
  childrenCount: number;
  onClose: () => void;
  onSent?: () => void;
};

const MESSAGE_OPTIONS: Array<{
  value: MessageType;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "running_late", label: "Running Late", icon: Clock3 },
  { value: "car_line_issue", label: "Car Line Issue", icon: Car },
  { value: "need_assistance", label: "Need Assistance", icon: AlertTriangle },
  { value: "other", label: "Other", icon: HelpCircle },
];

const PARENT_PICKUP_MESSAGE_CSS = `
.pz-parent-message-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pz-parent-message-option {
  min-height: 52px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}

.pz-parent-message-option svg {
  flex: 0 0 auto;
  color: var(--teal);
}

.pz-parent-message-option:hover:not(:disabled) {
  border-color: rgba(26,158,117,0.38);
  background: var(--white);
}

.pz-parent-message-option.active {
  border-color: var(--teal);
  background: var(--teal-pale);
  color: #065F46;
  box-shadow: 0 0 0 3px rgba(26,158,117,0.08);
}

.pz-parent-message-note {
  display: flex;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(239,159,39,0.28);
  border-radius: 12px;
  background: var(--amber-pale);
  color: #92400E;
  font-size: 12px;
  line-height: 1.5;
}

.pz-parent-message-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.pz-parent-message-count {
  display: flex;
  justify-content: flex-end;
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
}

@media (max-width: 640px) {
  .pz-parent-message-options {
    grid-template-columns: 1fr;
  }
}
`;

export default function ParentPickupMessageModal({ isOpen, childrenCount, onClose, onSent }: Props) {
  const [messageType, setMessageType] = useState<MessageType>("running_late");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setMessageType("running_late");
    setMessage("");
    setError("");
    onClose();
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (childrenCount <= 0) {
      setError("Add a child before messaging pickup staff.");
      return;
    }

    const trimmed = message.trim();
    if (messageType === "other" && !trimmed) {
      setError("Please add a short message.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/parent-guard-messages`,
        {
          message_type: messageType,
          message: trimmed || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success(response.data?.message || "Message sent to the pickup team.");
      }

      setMessageType("running_late");
      setMessage("");
      onSent?.();
      onClose();
    } catch (err: any) {
      const messageText = err.response?.data?.error || "Failed to send pickup team message.";
      setError(messageText);
      toast.error(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ParentModalPortal>
      <style>{PARENT_PICKUP_MESSAGE_CSS}</style>
      <div className="pz-parent-modal-overlay">
        <form className="pz-parent-modal pz-parent-form" onSubmit={submitMessage}>
          <div className="pz-parent-modal-head">
            <div className="pz-parent-modal-title-row">
              <div className="pz-parent-modal-icon">
                <MessageSquareText size={21} aria-hidden="true" />
              </div>
              <div>
                <h2 className="pz-parent-modal-title">Message Pickup Team</h2>
                <div className="pz-parent-modal-subtitle">
                  Send a quick pickup note to today&apos;s duty guards.
                </div>
              </div>
            </div>
            <button type="button" className="pz-parent-modal-close" onClick={resetAndClose} aria-label="Close message modal">
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="pz-parent-modal-body">
            <div className="pz-parent-form">
              <div>
                <div className="pz-parent-section-title" style={{ marginBottom: 10 }}>
                  Message Type
                </div>
                <div className="pz-parent-message-options">
                  {MESSAGE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`pz-parent-message-option ${messageType === option.value ? "active" : ""}`}
                        onClick={() => setMessageType(option.value)}
                        disabled={submitting}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pz-parent-field">
                <label htmlFor="pickup-team-message">Details</label>
                <textarea
                  id="pickup-team-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 600))}
                  placeholder="Optional note, such as estimated arrival time"
                  disabled={submitting}
                />
                <div className="pz-parent-message-count">{message.length}/600</div>
              </div>

              <div className="pz-parent-message-note">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>Pickup authorization still follows approved QR, document, guardian, and vehicle checks.</span>
              </div>

              {error && <p className="pz-parent-error">{error}</p>}
            </div>
          </div>

          <div className="pz-parent-modal-footer">
            <button type="button" onClick={resetAndClose} className="pz-parent-modal-button" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="pz-parent-modal-button primary">
              {submitting ? (
                <LoadingSpinner size="xs" className="pz-loading-inline" />
              ) : (
                <Send size={15} aria-hidden="true" />
              )}
              Send Message
            </button>
          </div>
        </form>
      </div>
    </ParentModalPortal>
  );
}
