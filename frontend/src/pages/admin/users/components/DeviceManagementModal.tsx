import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Copy, Fingerprint, Globe2, ShieldOff, Smartphone, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LAN_API_BASE } from "@/lib/api/link";

interface Device {
  id: number;
  device_name: string;
  device_fingerprint: string;
  user_agent: string;
  is_active: number | boolean;
  allowed_ip_address?: string | null;
  last_scan_ip?: string | null;
  last_scan_at?: string | null;
  registered_at: string;
}

interface DeviceManagementModalProps {
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
  };
  onUpdate: (deviceCount: number) => void;
}

export default function DeviceManagementModal({ onClose, user, onUpdate }: DeviceManagementModalProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [ipDrafts, setIpDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No auth token found");

        const res = await fetch(`${LAN_API_BASE}/devices/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          setDevices(data);
          setIpDrafts(
            data.reduce((acc: Record<number, string>, device: Device) => {
              acc[device.id] = device.allowed_ip_address || "";
              return acc;
            }, {})
          );
          onUpdate(data.length);
        } else {
          console.error("Server error:", res.status, data);
        }
      } catch (err) {
        console.error("Failed to fetch devices:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDevices();
    }
  }, [user]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const updateDevice = async (device: Device, nextActive = device.is_active) => {
    setSavingId(device.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${LAN_API_BASE}/devices/${user.id}/${device.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: Boolean(nextActive),
          allowed_ip_address: ipDrafts[device.id] || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update device");

      setDevices((prev) =>
        prev.map((item) =>
          item.id === device.id
            ? {
                ...item,
                is_active: Boolean(nextActive),
                allowed_ip_address: ipDrafts[device.id] || null,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update device:", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="pz-user-modal-overlay">
      <div className="pz-user-modal wide" role="dialog" aria-modal="true" aria-labelledby="devices-title">
        <div className="pz-user-modal-head">
          <div className="pz-user-modal-title-row">
            <div className="pz-user-modal-icon">
              <Smartphone size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-user-modal-title" id="devices-title">
                Registered Devices
              </h2>
              <div className="pz-user-modal-subtitle">
                {user.name} - {user.email}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-user-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-user-modal-body">
          {loading ? (
            <div className="pz-users-empty" style={{ minHeight: 220 }}>
              <div className="pz-users-empty-icon">
                <LoadingSpinner size="md" label="Loading registered devices" />
              </div>
              <div>Loading registered devices...</div>
            </div>
          ) : devices.length > 0 ? (
            <div className="pz-device-list">
              {devices.map((device) => (
                <div key={device.id} className="pz-device-card">
                  <div className="pz-device-card-top">
                    <div className="pz-device-icon">
                      <Smartphone size={19} aria-hidden="true" />
                    </div>
                    <div className="pz-device-heading">
                      <div className="pz-device-name-row">
                        <div className="pz-device-name">{device.device_name || "Unnamed device"}</div>
                        <span className={`pz-device-status ${Boolean(device.is_active) ? "active" : "disabled"}`}>
                          {Boolean(device.is_active) ? <BadgeCheck size={12} aria-hidden="true" /> : <ShieldOff size={12} aria-hidden="true" />}
                          {Boolean(device.is_active) ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="pz-device-meta">
                        Registered: {new Date(device.registered_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pz-device-copy"
                      onClick={() => copyToClipboard(device.device_fingerprint)}
                      title="Copy fingerprint"
                    >
                      <Copy size={12} aria-hidden="true" /> Copy ID
                    </button>
                  </div>

                  <div className="pz-device-detail-grid">
                    <div className="pz-device-detail">
                      <div className="pz-device-detail-label">
                        <Fingerprint size={13} aria-hidden="true" />
                        Fingerprint
                      </div>
                      <div className="pz-device-detail-value">{device.device_fingerprint}</div>
                    </div>
                    <div className="pz-device-detail">
                      <div className="pz-device-detail-label">
                        <Clock3 size={13} aria-hidden="true" />
                        Last Scan
                      </div>
                      <div className="pz-device-detail-value">
                        {device.last_scan_at
                          ? `${new Date(device.last_scan_at).toLocaleString()}${device.last_scan_ip ? ` from ${device.last_scan_ip}` : ""}`
                          : "No scans yet"}
                      </div>
                    </div>
                    <div className="pz-device-detail" style={{ gridColumn: "1 / -1" }}>
                      <div className="pz-device-detail-label">
                        <Globe2 size={13} aria-hidden="true" />
                        Browser Agent
                      </div>
                      <div className="pz-device-detail-value">{device.user_agent || "Not available"}</div>
                    </div>
                  </div>

                  <div className="pz-device-control-row">
                    <div className="pz-device-ip-field">
                      <label htmlFor={`device-ip-${device.id}`}>Allowed IP Address</label>
                      <input
                        id={`device-ip-${device.id}`}
                        value={ipDrafts[device.id] || ""}
                        onChange={(event) =>
                          setIpDrafts((prev) => ({ ...prev, [device.id]: event.target.value }))
                        }
                        placeholder={device.last_scan_ip || "Optional IP restriction"}
                        className="pz-device-ip-input"
                      />
                    </div>
                    <button
                      type="button"
                      className="pz-device-action success"
                      onClick={() => updateDevice(device)}
                      disabled={savingId === device.id}
                    >
                      {savingId === device.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <BadgeCheck size={14} aria-hidden="true" />}
                      Save IP
                    </button>
                    <button
                      type="button"
                      className={`pz-device-action ${Boolean(device.is_active) ? "danger" : "success"}`}
                      onClick={() => updateDevice(device, !Boolean(device.is_active))}
                      disabled={savingId === device.id}
                    >
                      {Boolean(device.is_active) ? <ShieldOff size={14} aria-hidden="true" /> : <BadgeCheck size={14} aria-hidden="true" />}
                      {Boolean(device.is_active) ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pz-users-empty" style={{ minHeight: 220 }}>
              <div className="pz-users-empty-icon">
                <Smartphone size={22} aria-hidden="true" />
              </div>
              <div>No devices registered yet.</div>
            </div>
          )}
        </div>

        <div className="pz-user-modal-footer">
          <button type="button" onClick={onClose} className="pz-users-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
