import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Check,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.pz-auth-page,
.pz-auth-page * {
  box-sizing: border-box;
}

.pz-auth-page {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --amber: #EF9F27;
  --red: #E24B4A;
  --white: #FFFFFF;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  --fd: 'Inter', 'Segoe UI', Arial, sans-serif;
  --fb: 'Inter', 'Segoe UI', Arial, sans-serif;
  min-height: 100vh;
  font-family: var(--fb);
  background: var(--navy);
  color: var(--white);
  position: relative;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

.pz-auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: var(--navy);
  overflow: hidden;
}

.pz-auth-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px);
  background-size: 52px 52px;
}

.pz-auth-glow-1 {
  position: absolute;
  top: -200px;
  left: -200px;
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(26,158,117,0.13) 0%, transparent 60%);
}

.pz-auth-glow-2 {
  position: absolute;
  bottom: -200px;
  right: -100px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(27,110,204,0.12) 0%, transparent 60%);
}

.pz-auth-glow-3 {
  position: absolute;
  top: 40%;
  left: 40%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(26,158,117,0.05) 0%, transparent 60%);
}

.pz-auth-particle {
  position: absolute;
  opacity: 0;
  animation: pzFloatParticle linear infinite;
  pointer-events: none;
  color: rgba(255,255,255,0.3);
}

.pz-auth-particle svg {
  width: 1em;
  height: 1em;
  display: block;
}

@keyframes pzFloatParticle {
  0% { opacity: 0; transform: translateY(0) scale(0.8) rotate(0deg); }
  10% { opacity: 0.15; }
  90% { opacity: 0.1; }
  100% { opacity: 0; transform: translateY(-120px) scale(1.1) rotate(20deg); }
}

.pz-auth-layout {
  position: relative;
  z-index: 10;
  display: flex;
  height: 100vh;
  height: 100svh;
  min-height: 0;
  overflow: hidden;
}

.pz-auth-left {
  width: min(560px, 42vw);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  order: 2;
  padding: 40px 56px;
  border-left: 1px solid rgba(255,255,255,0.07);
  background: rgba(7,29,59,0.5);
  backdrop-filter: blur(24px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(45,201,143,0.58) rgba(255,255,255,0.05);
}

.pz-auth-left.center-content {
  justify-content: center;
}

.pz-auth-left::-webkit-scrollbar {
  width: 7px;
}

.pz-auth-left::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.04);
}

.pz-auth-left::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(45,201,143,0.75), rgba(27,110,204,0.55));
  border-radius: 999px;
  border: 2px solid rgba(7,29,59,0.72);
}

.pz-auth-left::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(45,201,143,0.95), rgba(27,110,204,0.75));
}

.pz-auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 38px;
  text-decoration: none;
}

.pz-auth-brand-icon {
  width: 36px;
  height: 36px;
  background: var(--teal);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-auth-brand-icon svg {
  width: 19px;
  height: 19px;
  color: var(--white);
  stroke-width: 2.7;
}

.pz-auth-brand-name {
  font-family: var(--fd);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.02em;
}

.pz-form-brand {
  display: none;
}

.pz-visual-brand {
  position: absolute;
  top: 40px;
  left: 48px;
  margin-bottom: 0;
}

.pz-auth-title {
  font-family: var(--fd);
  font-size: 28px;
  font-weight: 700;
  color: var(--white);
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin: 0 0 10px;
}

.pz-auth-title .accent {
  color: var(--teal-light);
}

.pz-auth-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.54);
  line-height: 1.7;
  margin: 0 0 28px;
}

.pz-auth-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
}

.pz-auth-tab {
  flex: 1;
  padding: 10px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: rgba(255,255,255,0.45);
  text-decoration: none;
  transition: all 0.22s;
}

.pz-auth-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
}

.pz-auth-form {
  display: flex;
  flex-direction: column;
  animation: pzFormIn 0.3s ease;
}

@keyframes pzFormIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.pz-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.pz-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.66);
  letter-spacing: 0.02em;
}

.pz-field-wrap {
  position: relative;
}

.pz-field-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  pointer-events: none;
  opacity: 0.58;
}

.pz-field-icon svg,
.pz-pass-toggle svg {
  width: 16px;
  height: 16px;
  display: block;
}

.pz-input {
  width: 100%;
  padding: 11px 42px 11px 40px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  font-family: var(--fb);
  font-size: 14px;
  color: var(--white);
  outline: none;
  transition: all 0.2s;
}

.pz-input::placeholder {
  color: rgba(255,255,255,0.3);
}

.pz-input:focus {
  background: rgba(255,255,255,0.11);
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(26,158,117,0.15);
}

.pz-select {
  appearance: none;
}

.pz-input option {
  color: var(--text-1);
  background: var(--white);
}

.pz-input.error {
  border-color: var(--red);
}

.pz-error {
  font-size: 12px;
  color: #FF8A88;
  margin: -4px 0 12px;
}

.pz-pass-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.45);
  font-size: 15px;
  padding: 2px;
}

.pz-pass-toggle:hover {
  color: rgba(255,255,255,0.82);
}

.pz-role-section {
  margin-bottom: 20px;
}

.pz-role-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.66);
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.pz-role-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.pz-role-option {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 11px;
  padding: 12px 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  color: inherit;
  text-align: left;
}

.pz-role-option:hover {
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.22);
}

.pz-role-option.selected {
  border-color: var(--teal);
  background: rgba(26,158,117,0.12);
}

.pz-role-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.pz-role-icon svg {
  width: 17px;
  height: 17px;
  color: var(--white);
  stroke-width: 2.3;
}

.pz-role-copy {
  flex: 1;
  min-width: 0;
}

.pz-role-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--white);
  white-space: nowrap;
}

.pz-role-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.42);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pz-school-result-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.pz-school-result {
  width: 100%;
  min-width: 0;
}

.pz-school-result .pz-role-copy {
  min-width: 0;
  padding-right: 18px;
}

.pz-school-result .pz-role-name {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
}

.pz-school-result .pz-role-desc {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

.pz-auth-section {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 16px;
  margin-top: 4px;
}

.pz-auth-section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255,255,255,0.82);
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 12px;
}

.pz-auth-section-title svg {
  color: var(--teal-light);
  stroke-width: 2.5;
}

.pz-auth-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pz-role-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: var(--teal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.pz-role-option.selected .pz-role-check {
  opacity: 1;
}

.pz-role-check svg {
  width: 10px;
  height: 10px;
  stroke-width: 3;
}

.pz-submit {
  width: 100%;
  padding: 13px;
  background: var(--teal);
  color: var(--white);
  border: none;
  border-radius: 10px;
  font-family: var(--fb);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.22s;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.pz-submit:hover:not(:disabled) {
  background: var(--teal-light);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(26,158,117,0.3);
}

.pz-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.pz-secondary {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}

.pz-secondary:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
  box-shadow: none;
}

.pz-spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0 42%, transparent 43%),
    conic-gradient(from 0deg, var(--white), var(--teal-light), rgba(255,255,255,0.42), var(--white));
  box-shadow: 0 4px 14px rgba(7,29,59,0.18);
  animation: pzSpin 0.85s linear infinite;
}

.pz-spinner::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--teal), var(--blue));
}

@keyframes pzSpin {
  to { transform: rotate(360deg); }
}

.pz-forgot {
  text-align: right;
  margin: -6px 0 8px;
}

.pz-forgot a,
.pz-switch a {
  color: var(--teal-light);
  text-decoration: none;
  font-weight: 500;
}

.pz-forgot a {
  font-size: 12px;
  color: rgba(255,255,255,0.48);
}

.pz-forgot a:hover,
.pz-switch a:hover {
  text-decoration: underline;
}

.pz-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.44);
}

.pz-inline-row {
  display: flex;
  gap: 10px;
}

.pz-step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 24px;
}

.pz-step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s;
}

.pz-step-dot.done {
  background: var(--teal);
  color: white;
}

.pz-step-dot.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: 0 0 0 4px rgba(255,255,255,0.15);
}

.pz-step-dot.idle {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.35);
}

.pz-step-dot svg {
  width: 14px;
  height: 14px;
  stroke-width: 3;
}

.pz-step-line {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.1);
  transition: background 0.3s;
}

.pz-step-line.done {
  background: var(--teal);
}

.pz-hint {
  font-size: 12px;
  color: rgba(255,255,255,0.42);
  line-height: 1.6;
  text-align: center;
  min-height: 38px;
  margin: 10px 0 12px;
}

.pz-note {
  font-size: 11px;
  color: rgba(255,255,255,0.38);
  line-height: 1.55;
  margin-top: 5px;
}

.pz-alert {
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid rgba(226,75,74,0.28);
  background: rgba(226,75,74,0.12);
  color: #FFB1AF;
  font-size: 13px;
  line-height: 1.5;
  margin: 4px 0 12px;
}

.pz-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 22px 0 4px;
  animation: pzFormIn 0.4s ease;
}

.pz-success-circle {
  width: 72px;
  height: 72px;
  background: var(--teal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 20px;
  box-shadow: 0 0 0 12px rgba(26,158,117,0.15);
}

.pz-success-circle svg {
  width: 32px;
  height: 32px;
  stroke-width: 3;
}

.pz-success-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 8px;
}

.pz-success-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.54);
  line-height: 1.6;
  max-width: 300px;
}

.pz-role-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  background: rgba(26,158,117,0.15);
  border: 1px solid rgba(26,158,117,0.3);
  color: var(--teal-light);
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
}

.pz-role-tag svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.4;
}

.pz-auth-right {
  flex: 1;
  order: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 132px 40px 40px;
  position: relative;
  overflow: hidden;
  height: 100vh;
  height: 100svh;
}

.pz-right-content {
  max-width: 500px;
  width: 100%;
}

.pz-right-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(26,158,117,0.15);
  border: 1px solid rgba(26,158,117,0.3);
  color: var(--teal-light);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 5px 12px;
  border-radius: 100px;
  margin-bottom: 28px;
}

.pz-badge-dot {
  width: 6px;
  height: 6px;
  background: var(--teal-light);
  border-radius: 50%;
  animation: pzPulse 2s infinite;
}

@keyframes pzPulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.pz-right-heading {
  font-family: var(--fd);
  font-size: 38px;
  font-weight: 700;
  color: var(--white);
  line-height: 1.12;
  letter-spacing: -0.025em;
  margin-bottom: 28px;
}

.pz-right-heading .hl {
  color: var(--teal-light);
}

.pz-showcase {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 36px;
}

.pz-showcase-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px 18px;
  animation: pzShowcaseIn 0.5s ease both;
}

.pz-showcase-item:nth-child(1) { animation-delay: 0.1s; }
.pz-showcase-item:nth-child(2) { animation-delay: 0.2s; }
.pz-showcase-item:nth-child(3) { animation-delay: 0.3s; }

@keyframes pzShowcaseIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.pz-showcase-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.pz-showcase-icon svg {
  width: 19px;
  height: 19px;
  color: var(--white);
  stroke-width: 2.3;
}

.pz-showcase-info {
  flex: 1;
}

.pz-showcase-role {
  font-size: 13px;
  font-weight: 600;
  color: var(--white);
}

.pz-showcase-access {
  font-size: 11px;
  color: rgba(255,255,255,0.44);
  margin-top: 2px;
}

.pz-showcase-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  white-space: nowrap;
}

.pz-trust-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pz-trust-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: rgba(255,255,255,0.48);
}

.pz-trust-item svg {
  width: 14px;
  height: 14px;
  color: var(--teal-light);
  stroke-width: 2.4;
}

.pz-meter {
  margin: -2px 0 12px;
}

.pz-meter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
  color: rgba(255,255,255,0.62);
  font-size: 12px;
  font-weight: 500;
}

.pz-meter-row svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.4;
}

.pz-meter-track {
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}

.pz-meter-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s ease, background 0.25s ease;
}

.pz-meter-fill.weak {
  width: 33%;
  background: var(--red);
}

.pz-meter-fill.medium {
  width: 66%;
  background: var(--amber);
}

.pz-meter-fill.strong {
  width: 100%;
  background: var(--teal-light);
}

.pz-validation-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: -2px 0 12px;
  font-size: 12px;
  font-weight: 500;
}

.pz-validation-line svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.5;
}

.pz-validation-line.success {
  color: var(--teal-light);
}

.pz-validation-line.error {
  color: #FF8A88;
}

@media (max-width: 1180px) {
  .pz-auth-left {
    width: min(520px, 46vw);
    padding: 36px 38px;
  }
  .pz-auth-right {
    padding: 118px 30px 36px;
  }
  .pz-visual-brand {
    top: 34px;
    left: 36px;
  }
  .pz-right-content {
    max-width: 430px;
  }
  .pz-right-heading {
    font-size: 34px;
    margin-bottom: 24px;
  }
  .pz-showcase-item {
    gap: 12px;
    padding: 13px 15px;
  }
  .pz-showcase-access {
    max-width: 260px;
  }
}

@media (max-width: 1020px) {
  .pz-auth-left {
    width: min(500px, 50vw);
    padding: 32px 30px;
  }
  .pz-auth-title {
    font-size: 26px;
  }
  .pz-auth-sub {
    margin-bottom: 24px;
  }
  .pz-auth-right {
    padding-top: 108px;
  }
  .pz-right-content {
    max-width: 370px;
  }
  .pz-right-heading {
    font-size: 30px;
  }
  .pz-showcase-badge {
    display: none;
  }
  .pz-trust-row {
    gap: 12px;
  }
}

@media (max-width: 900px) {
  .pz-auth-page {
    overflow: hidden;
  }
  .pz-auth-layout {
    height: 100vh;
    height: 100svh;
    min-height: 0;
  }
  .pz-auth-right {
    display: none;
  }
  .pz-auth-left {
    width: 100%;
    height: 100vh;
    height: 100svh;
    min-height: 0;
    order: 1;
    border-left: none;
    padding: 34px clamp(30px, 11vw, 96px);
  }
  .pz-form-brand {
    display: flex;
  }
  .pz-visual-brand {
    display: none;
  }
}

@media (max-width: 640px) {
  .pz-auth-left {
    padding: 30px 20px;
  }
  .pz-auth-brand {
    margin-bottom: 28px;
  }
  .pz-auth-title {
    font-size: 24px;
  }
  .pz-auth-sub {
    font-size: 13px;
    margin-bottom: 22px;
  }
  .pz-auth-tabs {
    margin-bottom: 22px;
  }
  .pz-role-grid {
    grid-template-columns: 1fr;
  }
  .pz-role-option {
    padding: 12px;
  }
  .pz-input {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .pz-inline-row {
    flex-direction: column;
  }
  .pz-auth-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 380px) {
  .pz-auth-left {
    padding: 24px 14px;
  }
  .pz-auth-tabs {
    border-radius: 10px;
  }
  .pz-auth-tab {
    font-size: 13px;
    padding: 9px 6px;
  }
  .pz-auth-brand-name {
    font-size: 16px;
  }
  .pz-auth-title {
    font-size: 22px;
  }
  .pz-submit {
    padding: 12px;
  }
}
`

const particles = ['shield', 'key', 'check', 'lock', 'shield', 'key', 'check', 'lock', 'shield', 'key', 'check', 'lock']

const particleIcons: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  key: KeyRound,
  check: Check,
  lock: LockKeyhole,
}

type AuthShellProps = {
  activeTab: 'login' | 'signup'
  title: ReactNode
  subtitle: ReactNode
  children: ReactNode
  superAdmin?: boolean
  hideTabs?: boolean
  centerContent?: boolean
}

function ShieldLogo() {
  return <ShieldCheck aria-hidden="true" />
}

function ParticleIcon({ kind }: { kind: string }) {
  const Icon = particleIcons[kind] || ShieldCheck
  return <Icon aria-hidden="true" />
}

function RoleShowcase({ superAdmin = false }: { superAdmin?: boolean }) {
  const roles = superAdmin
    ? [
        {
          icon: <ShieldCheck aria-hidden="true" />,
          role: 'Super Admin',
          access: 'Full system access / All schools / Billing',
          badge: 'Restricted',
          badgeStyle: { background: 'rgba(27,110,204,0.2)', color: '#7DB8F7' },
          iconStyle: { background: 'rgba(27,110,204,0.15)', border: '1px solid rgba(27,110,204,0.25)' },
        },
      ]
    : [
        {
          icon: <Building2 aria-hidden="true" />,
          role: 'Admin',
          access: 'Approve pickups / Manage students / View logs',
          badge: 'Per school',
          badgeStyle: { background: 'rgba(27,110,204,0.2)', color: '#7DB8F7' },
          iconStyle: { background: 'rgba(27,110,204,0.15)', border: '1px solid rgba(27,110,204,0.25)' },
        },
        {
          icon: <UsersRound aria-hidden="true" />,
          role: 'Parent',
          access: 'Register students / Manage pickup access / Get QR',
          badge: 'Self-serve',
          badgeStyle: { background: 'rgba(26,158,117,0.15)', color: 'var(--teal-light)' },
          iconStyle: { background: 'rgba(26,158,117,0.15)', border: '1px solid rgba(26,158,117,0.25)' },
        },
        {
          icon: <ScanSearch aria-hidden="true" />,
          role: 'Guard',
          access: 'Scan QR codes / Verify identity / Gate access',
          badge: 'On-site',
          badgeStyle: { background: 'rgba(239,159,39,0.15)', color: 'var(--amber)' },
          iconStyle: { background: 'rgba(239,159,39,0.15)', border: '1px solid rgba(239,159,39,0.25)' },
        },
      ]

  return (
    <div className="pz-showcase">
      {roles.map((item) => (
        <div className="pz-showcase-item" key={item.role}>
          <div className="pz-showcase-icon" style={item.iconStyle}>{item.icon}</div>
          <div className="pz-showcase-info">
            <div className="pz-showcase-role">{item.role}</div>
            <div className="pz-showcase-access">{item.access}</div>
          </div>
          <div className="pz-showcase-badge" style={item.badgeStyle}>{item.badge}</div>
        </div>
      ))}
    </div>
  )
}

export default function AuthShell({ activeTab, title, subtitle, children, superAdmin = false, hideTabs = false, centerContent = false }: AuthShellProps) {
  return (
    <div className="pz-auth-page">
      <style>{AUTH_CSS}</style>
      <div className="pz-auth-bg" aria-hidden="true">
        <div className="pz-auth-grid" />
        <div className="pz-auth-glow-1" />
        <div className="pz-auth-glow-2" />
        <div className="pz-auth-glow-3" />
        {particles.map((kind, index) => (
          <div
            className="pz-auth-particle"
            key={`${kind}-${index}`}
            style={{
              left: `${8 + ((index * 11) % 86)}%`,
              top: `${44 + ((index * 7) % 42)}%`,
              fontSize: `${10 + (index % 5) * 2}px`,
              animationDuration: `${6 + (index % 5) * 1.4}s`,
              animationDelay: `${(index % 6) * 1.1}s`,
            }}
          >
            <ParticleIcon kind={kind} />
          </div>
        ))}
      </div>

      <div className="pz-auth-layout">
        <div className={`pz-auth-left${centerContent ? ' center-content' : ''}`}>
          <Link to="/" className="pz-auth-brand pz-form-brand">
            <div className="pz-auth-brand-icon"><ShieldLogo /></div>
            <div className="pz-auth-brand-name">Pickup Zone</div>
          </Link>

          {!superAdmin && !hideTabs && (
            <div className="pz-auth-tabs">
              <Link className={`pz-auth-tab ${activeTab === 'login' ? 'active' : ''}`} to="/login">Sign In</Link>
              <Link className={`pz-auth-tab ${activeTab === 'signup' ? 'active' : ''}`} to="/signup">Parent Sign Up</Link>
            </div>
          )}

          <h1 className="pz-auth-title">{title}</h1>
          <p className="pz-auth-sub">{subtitle}</p>

          {children}
        </div>

        <div className="pz-auth-right">
          <Link to="/" className="pz-auth-brand pz-visual-brand">
            <div className="pz-auth-brand-icon"><ShieldLogo /></div>
            <div className="pz-auth-brand-name">Pickup Zone</div>
          </Link>

          <div className="pz-right-content">
            <div className="pz-right-badge">
              <div className="pz-badge-dot" />
              {superAdmin ? 'Dedicated super admin access' : 'Role-based access control'}
            </div>
            <div className="pz-right-heading">
              {superAdmin ? (
                <>Protected access.<br /><span className="hl">System control.</span><br />One secure route.</>
              ) : (
                <>One platform.<br /><span className="hl">Three roles.</span><br />Zero confusion.</>
              )}
            </div>

            <RoleShowcase superAdmin={superAdmin} />

            <div className="pz-trust-row">
              <div className="pz-trust-item"><LockKeyhole aria-hidden="true" />End-to-end encrypted</div>
              <div className="pz-trust-item"><ShieldCheck aria-hidden="true" />COPPA compliant</div>
              <div className="pz-trust-item"><CheckCircle2 aria-hidden="true" />200+ schools trust us</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
