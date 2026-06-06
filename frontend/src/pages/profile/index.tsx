import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  Camera,
  KeyRound,
  Mail,
  Save,
  UploadCloud,
  Volume2,
  VolumeX,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import GuardLayout from "@/components/layouts/GuardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { contactStatusClass, useContactAvailability } from "@/lib/hooks/useContactAvailability";
import { useNotificationSoundPreferences } from "@/lib/notifications/notificationSound";

type DashboardRole = "parent" | "admin" | "super-admin" | "guard";

const PROFILE_SETTINGS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-profile-page {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --navy-light: #123B75;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --teal-pale: #E1F5EE;
  --amber: #EF9F27;
  --amber-pale: #FEF3DC;
  --red: #E24B4A;
  --red-pale: #FDEAEA;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --surface-2: #EBEEF5;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  --radius: 12px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-profile-page,
.pz-profile-page * {
  box-sizing: border-box;
}

.pz-profile-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-profile-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--teal);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.pz-profile-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-profile-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
  color: var(--text-1);
}

.pz-profile-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-profile-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pz-profile-date-pill,
.pz-profile-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}

.pz-profile-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-profile-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-profile-button:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-profile-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-profile-button.primary:hover {
  background: var(--teal-light);
  border-color: var(--teal-light);
  color: var(--white);
}

.pz-profile-button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.pz-profile-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.34fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.pz-profile-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.pz-profile-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 0 16px;
  border-bottom: 0;
}

.pz-profile-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-profile-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.55;
}

.pz-profile-photo-card {
  padding: 0;
  text-align: left;
}

.pz-profile-photo {
  width: 154px;
  height: 154px;
  border-radius: 24px;
  margin: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 38px;
  font-weight: 800;
  box-shadow: 0 18px 50px rgba(7,29,59,0.16);
}

.pz-profile-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pz-profile-display-name {
  color: var(--text-1);
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-top: 18px;
}

.pz-profile-role {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--teal-pale);
  color: #065F46;
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.pz-profile-photo-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 18px;
}

.pz-profile-file-input {
  display: none;
}

.pz-profile-form {
  padding: 0;
}

.pz-profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.pz-profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pz-profile-field label {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
}

.pz-profile-field input {
  width: 100%;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-1);
  outline: none;
  padding: 0 12px;
  font: inherit;
  font-size: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pz-profile-field input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-profile-feedback {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.pz-profile-feedback.hint {
  color: var(--text-3);
}

.pz-profile-feedback.success {
  color: #047857;
}

.pz-profile-feedback.error {
  color: #991B1B;
}

.pz-profile-email-code {
  margin-top: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.pz-profile-email-code input {
  height: 38px;
}

.pz-profile-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}

.pz-profile-security-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.pz-profile-sound-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.pz-profile-sound-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.48fr);
  gap: 18px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  padding: 16px;
}

.pz-profile-sound-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.pz-profile-sound-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-profile-sound-icon.enabled {
  background: var(--teal-pale);
  color: var(--teal);
}

.pz-profile-sound-icon.muted {
  background: var(--red-pale);
  color: var(--red);
}

.pz-profile-sound-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
}

.pz-profile-sound-copy {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.45;
  margin-top: 3px;
}

.pz-profile-sound-controls {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  width: 100%;
}

.pz-profile-sound-switch {
  width: 48px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #CAD2DF;
  padding: 3px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.pz-profile-sound-switch span {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--white);
  box-shadow: 0 2px 6px rgba(7,29,59,0.16);
  transition: transform 0.18s ease;
}

.pz-profile-sound-switch.on {
  background: var(--teal);
  border-color: var(--teal);
}

.pz-profile-sound-switch.on span {
  transform: translateX(20px);
}

.pz-profile-volume-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pz-profile-volume-stack {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.pz-profile-volume-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
}

.pz-profile-volume-label strong {
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-profile-volume-control input[type="range"] {
  width: 100%;
  accent-color: var(--teal);
}

.pz-profile-volume-control input[type="range"]:disabled {
  opacity: 0.45;
}

.pz-profile-volume-actions {
  display: grid;
  grid-template-columns: minmax(74px, 0.72fr) minmax(78px, auto);
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.pz-profile-volume-number {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.pz-profile-volume-number input {
  width: 100%;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-1);
  outline: none;
  padding: 0 28px 0 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pz-profile-volume-number input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-profile-volume-number input:disabled {
  opacity: 0.55;
}

.pz-profile-volume-suffix {
  position: absolute;
  right: 10px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
  pointer-events: none;
}

.pz-profile-sound-test {
  min-width: 78px;
  padding-inline: 10px;
}

.pz-profile-note {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  border: 0;
  border-left: 3px solid var(--teal);
  background: transparent;
  color: #065F46;
  border-radius: 0;
  padding: 2px 0 2px 12px;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
}

.pz-profile-loading {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
}

.pz-profile-loading-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1180px) {
  .pz-profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .pz-profile-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-profile-header-actions {
    justify-content: flex-start;
  }
  .pz-profile-form-grid {
    grid-template-columns: 1fr;
  }
  .pz-profile-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-profile-photo {
    width: 132px;
    height: 132px;
  }
  .pz-profile-form-footer {
    flex-direction: column;
  }
  .pz-profile-form-footer .pz-profile-button {
    width: 100%;
  }
  .pz-profile-sound-panel {
    grid-template-columns: 1fr;
  }
  .pz-profile-sound-controls {
    grid-template-columns: 1fr;
  }
  .pz-profile-sound-switch {
    justify-self: start;
  }
  .pz-profile-volume-actions {
    grid-template-columns: minmax(78px, 0.45fr) minmax(86px, 0.55fr);
  }
  .pz-profile-sound-test {
    width: 100%;
  }
}
`;

export default function Profile({ initialRole }: { initialRole?: DashboardRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeRole: DashboardRole = location.pathname.startsWith("/guard")
    ? "guard"
    : location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/super-admin")
        ? "super-admin"
        : "parent";
  const [role, setRole] = useState<DashboardRole>(initialRole ?? routeRole);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileVersion, setProfileVersion] = useState<number>(Date.now());
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const {
    soundPreferences,
    updateSoundPreferences,
    testNotificationSound,
  } = useNotificationSoundPreferences(userData?.id);
  const soundVolumePercent = clampVolumePercent(soundPreferences.volume * 100);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const nextRole = normalizeRole(data.role) ?? initialRole ?? routeRole;
        setUserData(data);
        setFormData(data);
        setRole(nextRole);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayName = useMemo(
    () =>
      [formData?.firstName, formData?.lastName].filter(Boolean).join(" ").trim() ||
      userData?.name ||
      userData?.email ||
      "Pickup Zone",
    [formData?.firstName, formData?.lastName, userData?.email, userData?.name]
  );

  const avatarSrc = previewUrl
    ? previewUrl
    : userData?.profile_picture
      ? `${LOCAL_BASE}${userData.profile_picture}${profileVersion ? `?v=${profileVersion}` : ""}`
      : "";

  const backTarget =
    role === "super-admin"
      ? "/super-admin"
      : role === "admin"
        ? "/admin"
        : role === "guard"
          ? "/guard"
          : "/parent";
  const emailChanged =
    Boolean(userData?.email) &&
    String(formData?.email || "").trim().toLowerCase() !== String(userData?.email || "").trim().toLowerCase();
  const emailAvailability = useContactAvailability("email", formData.email || "", {
    enabled: Boolean(userData),
    excludeUserId: userData?.id,
  });
  const phoneAvailability = useContactAvailability("phone", formData.phone || "", {
    enabled: Boolean(userData),
    excludeUserId: userData?.id,
  });
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false;
  const emailCodeReady =
    !emailChanged ||
    (codeSentTo &&
      codeSentTo.toLowerCase() === String(formData.email || "").trim().toLowerCase() &&
      emailVerificationCode.trim().length >= 4);
  const passwordReady =
    Boolean(passwordData.currentPassword) &&
    passwordData.newPassword.length >= 8 &&
    passwordData.newPassword === passwordData.confirmPassword;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    if (event.target.name === "email") {
      setEmailVerificationCode("");
      setCodeSentTo("");
    }
  };

  const handlePasswordInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSoundToggle = () => {
    updateSoundPreferences({ enabled: !soundPreferences.enabled });
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSoundPreferences({ volume: clampVolumePercent(event.target.value) / 100 });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData(userData);
    setSelectedImage(null);
    setEmailVerificationCode("");
    setCodeSentTo("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const requestEmailCode = async () => {
    if (!emailChanged || !formData.email) return;
    if (emailAvailability.available === false) {
      toast.error(emailAvailability.message || "Email address is already taken.");
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-email-change-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send verification code");
        return;
      }

      setCodeSentTo(String(formData.email || "").trim());
      toast.success(data.message || "Verification code sent");
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordReady) {
      toast.error("Enter the current password and matching new password.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(data.message || "Password changed successfully");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hasAvailabilityBlock) {
      toast.error("Please use an available email address and mobile number.");
      return;
    }

    if (!emailCodeReady) {
      toast.error("Verify the new email address before saving.");
      return;
    }

    setSaving(true);

    const form = new FormData();
    form.append("firstName", formData.firstName || "");
    form.append("lastName", formData.lastName || "");
    form.append("email", formData.email || "");
    form.append("phone", formData.phone || "");
    if (emailChanged) {
      form.append("emailVerificationCode", emailVerificationCode.trim());
    }
    if (selectedImage) {
      form.append("profilePicture", selectedImage);
    }

    const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: form,
    });

    setSaving(false);

    if (!res.ok) {
      toast.error("Failed to update profile");
      return;
    }

    const updated = await res.json();
    const cacheBuster = Date.now();
    const updatedProfile = {
      ...updated,
      profile_picture_cache_buster: cacheBuster,
    };

    setUserData(updatedProfile);
    setFormData(updatedProfile);
    setSelectedImage(null);
    setEmailVerificationCode("");
    setCodeSentTo("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setProfileVersion(cacheBuster);

    window.dispatchEvent(
      new CustomEvent("pickupzone:user-updated", {
        detail: updatedProfile,
      })
    );

    toast.success("Profile updated successfully");
  };

  if (!userData) {
    if (role === "admin") {
      return (
        <DashboardLayout role="admin">
          <AdminPageSkeleton variant="settings" label="Loading profile settings" />
        </DashboardLayout>
      );
    }

    const loadingContent = (
      <>
        <style>{PROFILE_SETTINGS_CSS}</style>
        <div className="pz-profile-page">
          <div className="pz-profile-loading">
            <div className="pz-profile-loading-icon">
              <LoadingSpinner size="lg" label="Loading profile settings" />
            </div>
            Loading profile settings...
          </div>
        </div>
      </>
    );

    return role === "guard" ? (
      <GuardLayout>{loadingContent}</GuardLayout>
    ) : (
      <DashboardLayout role={role}>{loadingContent}</DashboardLayout>
    );
  }

  const profileContent = (
    <>
      <style>{PROFILE_SETTINGS_CSS}</style>
      <div className="pz-profile-page">
        <div className="pz-profile-header">
          <div>
            <div className="pz-profile-kicker">Account</div>
            <h1 className="pz-profile-title">Profile Settings</h1>
            <div className="pz-profile-subtitle">
              Update your personal details and profile photo for Pickup Zone.
            </div>
          </div>
          <div className="pz-profile-header-actions">
            <div className="pz-profile-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button type="button" className="pz-profile-button" onClick={() => navigate(backTarget)}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="pz-profile-grid">
          <section className="pz-profile-card">
            <div className="pz-profile-card-header">
              <div>
                <div className="pz-profile-card-title">Profile Preview</div>
                <div className="pz-profile-card-subtitle">This is what appears in the dashboard sidebar.</div>
              </div>
            </div>
            <div className="pz-profile-photo-card">
              <div className="pz-profile-photo">
                {avatarSrc ? <img src={avatarSrc} alt={displayName} /> : initials(displayName)}
              </div>
              <div className="pz-profile-display-name">{displayName}</div>
              <div className="pz-profile-role">
                <span>{roleLabel(role)}</span>
              </div>
              <div className="pz-profile-photo-actions">
                <input
                  id="profile-picture-upload"
                  className="pz-profile-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label className="pz-profile-button primary" htmlFor="profile-picture-upload">
                  <UploadCloud size={15} aria-hidden="true" />
                  Upload Photo
                </label>
                {selectedImage && (
                  <button type="button" className="pz-profile-button" onClick={resetForm}>
                    Clear Preview
                  </button>
                )}
              </div>
              <div className="pz-profile-note">
                <Camera size={17} aria-hidden="true" />
                <span>
                  After saving, the sidebar avatar and name update immediately without refreshing the page.
                </span>
              </div>
            </div>
          </section>

          <section className="pz-profile-card">
            <div className="pz-profile-card-header">
              <div>
                <div className="pz-profile-card-title">Personal Information</div>
                <div className="pz-profile-card-subtitle">These fields stay connected to the existing profile API.</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="pz-profile-form">
              <div className="pz-profile-form-grid">
                <div className="pz-profile-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="pz-profile-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="pz-profile-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                  />
                  {emailAvailability.message && (
                    <p className={`pz-profile-feedback ${contactStatusClass(emailAvailability)}`}>
                      {emailAvailability.message}
                    </p>
                  )}
                  {emailChanged && (
                    <>
                      <div className="pz-profile-email-code">
                        <input
                          type="text"
                          value={emailVerificationCode}
                          onChange={(event) => setEmailVerificationCode(event.target.value)}
                          placeholder="Verification code"
                          inputMode="numeric"
                        />
                        <button
                          type="button"
                          className="pz-profile-button"
                          onClick={requestEmailCode}
                          disabled={
                            sendingCode ||
                            emailAvailability.checking ||
                            emailAvailability.available !== true
                          }
                        >
                          <Mail size={15} aria-hidden="true" />
                          {sendingCode ? "Sending..." : codeSentTo ? "Resend Code" : "Send Code"}
                        </button>
                      </div>
                      {codeSentTo && (
                        <p className="pz-profile-feedback success">Code sent to {codeSentTo}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="pz-profile-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                  />
                  {phoneAvailability.message && (
                    <p className={`pz-profile-feedback ${contactStatusClass(phoneAvailability)}`}>
                      {phoneAvailability.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pz-profile-form-footer">
                <button type="button" className="pz-profile-button" onClick={resetForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pz-profile-button primary"
                  disabled={saving || hasAvailabilityBlock || !emailCodeReady}
                >
                  <Save size={15} aria-hidden="true" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            <div className="pz-profile-security-section">
              <div className="pz-profile-card-header">
                <div>
                  <div className="pz-profile-card-title">Change Password</div>
                  <div className="pz-profile-card-subtitle">
                    Use your current password to set a new password for this account.
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="pz-profile-form">
                <div className="pz-profile-form-grid">
                  <div className="pz-profile-field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInput}
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="pz-profile-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInput}
                      autoComplete="new-password"
                    />
                    {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                      <p className="pz-profile-feedback error">Use at least 8 characters.</p>
                    )}
                  </div>

                  <div className="pz-profile-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInput}
                      autoComplete="new-password"
                    />
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="pz-profile-feedback error">Passwords do not match.</p>
                    )}
                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                      <p className="pz-profile-feedback success">Passwords match.</p>
                    )}
                  </div>
                </div>

                <div className="pz-profile-form-footer">
                  <button
                    type="button"
                    className="pz-profile-button"
                    onClick={() => setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="pz-profile-button primary"
                    disabled={changingPassword || !passwordReady}
                  >
                    <KeyRound size={15} aria-hidden="true" />
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>

            <div className="pz-profile-sound-section">
              <div className="pz-profile-card-header">
                <div>
                  <div className="pz-profile-card-title">Notification Sound</div>
                  <div className="pz-profile-card-subtitle">
                    Applies to pickup, document, safety, and parent-message notifications.
                  </div>
                </div>
              </div>

              <div className="pz-profile-sound-panel">
                <div className="pz-profile-sound-status">
                  <span className={`pz-profile-sound-icon ${soundPreferences.enabled ? "enabled" : "muted"}`}>
                    {soundPreferences.enabled ? (
                      <Volume2 size={20} aria-hidden="true" />
                    ) : (
                      <VolumeX size={20} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <div className="pz-profile-sound-name">
                      {soundPreferences.enabled ? "Sound alerts on" : "Sound alerts muted"}
                    </div>
                    <div className="pz-profile-sound-copy">
                      Volume is saved for this account on this device.
                    </div>
                  </div>
                </div>

                <div className="pz-profile-sound-controls">
                  <button
                    type="button"
                    className={`pz-profile-sound-switch ${soundPreferences.enabled ? "on" : ""}`}
                    role="switch"
                    aria-checked={soundPreferences.enabled}
                    aria-label="Toggle notification sound"
                    onClick={handleSoundToggle}
                  >
                    <span />
                  </button>

                  <div className="pz-profile-volume-stack">
                    <label className="pz-profile-volume-control" htmlFor="notificationVolume">
                      <span className="pz-profile-volume-label">
                        Volume <strong>{soundVolumePercent}%</strong>
                      </span>
                      <input
                        id="notificationVolume"
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={soundVolumePercent}
                        disabled={!soundPreferences.enabled}
                        onChange={handleVolumeChange}
                      />
                    </label>

                    <div className="pz-profile-volume-actions">
                      <label className="pz-profile-volume-number" htmlFor="notificationVolumePercent">
                        <input
                          id="notificationVolumePercent"
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          inputMode="numeric"
                          value={soundVolumePercent}
                          disabled={!soundPreferences.enabled}
                          onChange={handleVolumeChange}
                          aria-label="Notification volume percent"
                        />
                        <span className="pz-profile-volume-suffix">%</span>
                      </label>

                      <button
                        type="button"
                        className="pz-profile-button pz-profile-sound-test"
                        disabled={!soundPreferences.enabled}
                        onClick={testNotificationSound}
                      >
                        <BellRing size={15} aria-hidden="true" />
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );

  return role === "guard" ? (
    <GuardLayout>{profileContent}</GuardLayout>
  ) : (
    <DashboardLayout role={role}>{profileContent}</DashboardLayout>
  );
}

function normalizeRole(role?: string): DashboardRole | null {
  if (role === "admin") return "admin";
  if (role === "super-admin" || role === "superadmin") return "super-admin";
  if (role === "parent") return "parent";
  if (role === "guard") return "guard";
  return null;
}

function clampVolumePercent(value: string | number) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 1;
  return Math.min(100, Math.max(1, Math.round(percent)));
}

function roleLabel(role: DashboardRole) {
  if (role === "super-admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "guard") return "Guard";
  return "Parent";
}

function initials(name?: string) {
  if (!name) return "PZ";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
