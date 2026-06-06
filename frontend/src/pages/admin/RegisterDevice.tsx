import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  MonitorSmartphone,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toast";
import { LAN_API_BASE } from "@/lib/api/link";

const REGISTER_DEVICE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

.pz-device-register {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --teal-pale: #E1F5EE;
  --amber: #EF9F27;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --surface-2: #EBEEF5;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(7,29,59,0.06), rgba(26,158,117,0.08)),
    var(--surface);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
  display: grid;
  place-items: center;
  padding: 26px;
}

.pz-device-register,
.pz-device-register * {
  box-sizing: border-box;
}

.pz-device-register-shell {
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1fr);
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 28px 90px rgba(7,29,59,0.16);
}

.pz-device-register-side {
  background: linear-gradient(135deg, var(--navy), var(--navy-mid));
  color: var(--white);
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  min-height: 470px;
}

.pz-device-register-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 800;
}

.pz-device-register-brand-icon,
.pz-device-register-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--teal);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-device-register-kicker {
  color: var(--teal-light);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.pz-device-register-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: 0;
  margin: 0;
}

.pz-device-register-copy {
  color: rgba(255,255,255,0.72);
  line-height: 1.6;
  font-size: 14px;
  margin-top: 14px;
}

.pz-device-register-checks {
  display: grid;
  gap: 12px;
}

.pz-device-register-check {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255,255,255,0.82);
  font-size: 13px;
  font-weight: 700;
}

.pz-device-register-main {
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pz-device-register-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
  margin: 0;
}

.pz-device-register-card-copy {
  color: var(--text-3);
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0 24px;
}

.pz-device-register-field {
  display: grid;
  gap: 7px;
  margin-bottom: 16px;
}

.pz-device-register-field label {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 900;
}

.pz-device-register-field input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
  color: var(--text-1);
  outline: none;
  padding: 0 13px;
  font: inherit;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.pz-device-register-field input:focus {
  border-color: var(--blue);
  background: var(--white);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-device-register-button {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--teal);
  border-radius: 11px;
  background: var(--teal);
  color: var(--white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}

.pz-device-register-button:hover:not(:disabled) {
  background: var(--teal-light);
  border-color: var(--teal-light);
}

.pz-device-register-button:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.pz-device-register-details {
  margin-top: 22px;
  display: grid;
  gap: 10px;
}

.pz-device-register-detail {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FAFBFD;
  padding: 11px 12px;
}

.pz-device-register-detail-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #EFF6FF;
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pz-device-register-detail-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.pz-device-register-detail-value {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 2px;
  overflow-wrap: anywhere;
}

.pz-device-register-success {
  border: 1px solid rgba(26,158,117,0.28);
  background: var(--teal-pale);
  color: #065F46;
  border-radius: 12px;
  padding: 12px 13px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
  margin-bottom: 18px;
}

.pz-device-register-loading {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: var(--text-3);
  text-align: center;
}

@media (max-width: 820px) {
  .pz-device-register {
    padding: 14px;
  }
  .pz-device-register-shell {
    grid-template-columns: 1fr;
  }
  .pz-device-register-side {
    min-height: auto;
    padding: 24px;
  }
  .pz-device-register-main {
    padding: 24px;
  }
}
`;

export default function RegisterDevice() {
  const [searchParams] = useSearchParams();
  const guardId = searchParams.get("g") || searchParams.get("guardId");
  const token = searchParams.get("t") || searchParams.get("token");
  const [deviceName, setDeviceName] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const collectFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
        setUserAgent(navigator.userAgent);
      } catch {
        toast.error("Unable to verify this device fingerprint.");
      } finally {
        setLoading(false);
      }
    };

    collectFingerprint();
  }, []);

  const handleSubmit = async () => {
    if (!guardId || !token) {
      toast.error("This device registration link is invalid or expired.");
      return;
    }

    if (!deviceName.trim()) {
      toast.error("Please enter a device name.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${LAN_API_BASE}/devices/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guard_id: guardId,
          device_name: deviceName.trim(),
          device_fingerprint: fingerprint,
          user_agent: userAgent,
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed.");
        return;
      }

      setRegistered(true);
      toast.success("Device registered successfully.");
    } catch {
      toast.error("Something went wrong while registering this device.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pz-device-register">
      <style>{REGISTER_DEVICE_CSS}</style>
      <section className="pz-device-register-shell" aria-label="Device registration">
        <aside className="pz-device-register-side">
          <div className="pz-device-register-brand">
            <div className="pz-device-register-brand-icon">
              <ShieldCheck size={21} aria-hidden="true" />
            </div>
            Pickup Zone
          </div>

          <div>
            <div className="pz-device-register-kicker">Secure Guard Access</div>
            <h1 className="pz-device-register-title">Register This Device</h1>
            <p className="pz-device-register-copy">
              This device will be authorized for QR scan access after the fingerprint and browser details are verified.
            </p>
          </div>

          <div className="pz-device-register-checks">
            <div className="pz-device-register-check">
              <BadgeCheck size={16} aria-hidden="true" />
              Device fingerprint captured
            </div>
            <div className="pz-device-register-check">
              <Wifi size={16} aria-hidden="true" />
              Network checks remain tied to admin settings
            </div>
            <div className="pz-device-register-check">
              <CheckCircle2 size={16} aria-hidden="true" />
              Registration link is validated by the server
            </div>
          </div>
        </aside>

        <main className="pz-device-register-main">
          {loading ? (
            <div className="pz-device-register-loading">
              <LoadingSpinner size="lg" label="Loading device information" />
              <div>Verifying this device...</div>
            </div>
          ) : (
            <>
              {registered && (
                <div className="pz-device-register-success">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>This device is registered. It can now be managed from the admin registered devices panel.</span>
                </div>
              )}

              <h2 className="pz-device-register-card-title">Device Details</h2>
              <p className="pz-device-register-card-copy">
                Give this device a recognizable name so admins can identify it later.
              </p>

              <div className="pz-device-register-field">
                <label htmlFor="device-name">Device Name</label>
                <input
                  id="device-name"
                  type="text"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="e.g. Front gate Android phone"
                  disabled={registered || submitting}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="pz-device-register-button"
                disabled={registered || submitting || !fingerprint}
              >
                {submitting ? (
                  <LoadingSpinner size="xs" className="pz-loading-inline" />
                ) : (
                  <MonitorSmartphone size={17} aria-hidden="true" />
                )}
                {registered ? "Device Registered" : submitting ? "Registering..." : "Register Device"}
              </button>

              <div className="pz-device-register-details">
                <div className="pz-device-register-detail">
                  <div className="pz-device-register-detail-icon">
                    <Fingerprint size={17} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-device-register-detail-label">Device ID</div>
                    <div className="pz-device-register-detail-value">{fingerprint || "Unavailable"}</div>
                  </div>
                </div>
                <div className="pz-device-register-detail">
                  <div className="pz-device-register-detail-icon">
                    <MonitorSmartphone size={17} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-device-register-detail-label">Browser Agent</div>
                    <div className="pz-device-register-detail-value">{userAgent || "Unavailable"}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </section>
    </div>
  );
}
