import { Link, useSearchParams } from "react-router-dom";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Database,
  Facebook,
  Instagram,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Twitter,
  UsersRound,
} from "lucide-react";
import FeaturesSection from "./Features";
import HowItWorksSection from "./HowItWorksSection";
import PricingPlanSection from "./Pricing";
import { API_BASE_URL } from "@/lib/api/link";

const PUBLIC_PAGE_CSS = `
.pz-public-shell {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --blue: #1B6ECC;
  --blue-light: #3D8FE8;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --surface: #EFF3F9;
  --off-white: #F5F7FA;
  --white: #FFFFFF;
  --text-primary: #0A1628;
  --text-secondary: #4A5568;
  --text-muted: #8A96A8;
  --border: rgba(10,22,40,0.10);
  --font-display: Inter, "Segoe UI", Arial, sans-serif;
  --font-body: Inter, "Segoe UI", Arial, sans-serif;
  min-height: 100vh;
  background: var(--white);
  color: var(--text-primary);
  font-family: var(--font-body);
}

.pz-public-shell *,
.pz-public-shell *::before,
.pz-public-shell *::after {
  box-sizing: border-box;
}

.pz-public-shell nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 40px;
  background: rgba(7,29,59,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}

.pz-public-shell .nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.pz-public-shell .nav-logo-icon {
  width: 34px;
  height: 34px;
  background: var(--teal);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-public-shell .landing-icon {
  width: 1em;
  height: 1em;
  display: block;
  color: currentColor;
  stroke-width: 2.2;
}

.pz-public-shell .shield-svg {
  width: 18px;
  height: 18px;
}

.pz-public-shell .nav-logo-text {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.02em;
}

.pz-public-shell .nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.pz-public-shell .nav-links a {
  color: rgba(255,255,255,0.65);
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
  transition: color 0.2s;
}

.pz-public-shell .nav-links a:hover {
  color: var(--white);
}

.pz-public-shell .nav-cta {
  background: var(--teal);
  color: var(--white) !important;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500 !important;
  transition: background 0.2s !important;
}

.pz-public-shell .nav-cta:hover {
  background: var(--teal-light) !important;
}

.pz-public-shell .nav-login {
  color: var(--white) !important;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 500 !important;
}

.pz-public-shell .nav-login:hover {
  background: rgba(255,255,255,0.08);
}

.pz-public-shell .nav-toggle {
  display: none;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 10px;
  background: rgba(255,255,255,0.07);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
}

.pz-public-shell .nav-toggle span {
  width: 18px;
  height: 2px;
  background: var(--white);
  border-radius: 999px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.pz-public-shell .nav-toggle.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.pz-public-shell .nav-toggle.active span:nth-child(2) {
  opacity: 0;
}

.pz-public-shell .nav-toggle.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.pz-public-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.pz-public-button {
  color: var(--white);
  background: var(--teal);
}

.pz-public-button:hover {
  background: var(--teal-light);
}

.pz-public-button.ghost {
  color: var(--text-primary);
  background: var(--white);
  border: 1px solid var(--border);
}

.pz-public-hero {
  position: relative;
  overflow: hidden;
  background: var(--navy);
  color: var(--white);
  padding: 132px 40px 76px;
}

.pz-public-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.pz-public-glow {
  position: absolute;
  top: -160px;
  left: 50%;
  width: 820px;
  height: 560px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(26,158,117,0.18) 0%, rgba(27,110,204,0.10) 45%, transparent 70%);
  pointer-events: none;
}

.pz-public-hero-inner {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.48fr);
  gap: 48px;
  align-items: center;
}

.pz-public-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid rgba(26,158,117,0.35);
  background: rgba(26,158,117,0.15);
  color: var(--teal-light);
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 22px;
}

.pz-public-title {
  margin: 0;
  max-width: 780px;
  font-size: clamp(42px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.pz-public-title span {
  color: var(--teal-light);
}

.pz-public-subtitle {
  margin: 22px 0 0;
  max-width: 650px;
  color: rgba(255,255,255,0.62);
  font-size: 17px;
  line-height: 1.75;
}

.pz-public-hero-card {
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  background: rgba(255,255,255,0.05);
  padding: 24px;
  backdrop-filter: blur(8px);
}

.pz-public-hero-card-title {
  color: var(--white);
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 16px;
}

.pz-public-mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pz-public-mini {
  min-height: 110px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  padding: 16px;
  color: rgba(255,255,255,0.78);
  font-size: 13px;
}

.pz-public-mini svg {
  width: 24px;
  height: 24px;
  color: var(--teal-light);
  margin-bottom: 12px;
}

.pz-public-section {
  padding: 82px 40px;
}

.pz-public-section.alt {
  background: var(--off-white);
}

.pz-public-container {
  max-width: 1180px;
  margin: 0 auto;
}

.pz-public-grid {
  display: grid;
  gap: 20px;
}

.pz-public-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pz-public-grid.two {
  grid-template-columns: minmax(0, 0.78fr) minmax(360px, 1fr);
  align-items: start;
}

.pz-public-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--white);
  padding: 26px;
  box-shadow: 0 10px 34px rgba(7,29,59,0.06);
}

.pz-public-card.dark {
  border-color: transparent;
  background: var(--navy);
  color: var(--white);
}

.pz-public-card svg {
  width: 26px;
  height: 26px;
  color: var(--teal);
  margin-bottom: 16px;
}

.pz-public-card.dark svg {
  color: var(--teal-light);
}

.pz-public-card h2,
.pz-public-card h3 {
  margin: 0 0 10px;
  color: inherit;
  font-size: 20px;
  line-height: 1.2;
}

.pz-public-card p,
.pz-public-card li {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.pz-public-card.dark p {
  color: rgba(255,255,255,0.62);
}

.pz-public-form {
  border-top: 4px solid var(--teal);
}

.pz-public-form-head {
  margin-bottom: 24px;
}

.pz-public-form-head h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.pz-public-form-head p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.pz-public-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pz-public-field {
  display: grid;
  gap: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.pz-public-field.full {
  grid-column: 1 / -1;
}

.pz-public-input,
.pz-public-textarea {
  width: 100%;
  border: 1px solid #D8DEE9;
  border-radius: 10px;
  background: var(--white);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pz-public-input {
  height: 44px;
  padding: 0 13px;
}

.pz-public-textarea {
  min-height: 150px;
  resize: vertical;
  padding: 13px;
  line-height: 1.6;
}

.pz-public-input:focus,
.pz-public-textarea:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px rgba(26,158,117,0.10);
}

.pz-public-alert {
  margin-top: 16px;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 800;
}

.pz-public-alert.error {
  background: #FDEAEA;
  color: #991B1B;
}

.pz-public-alert.success {
  background: #E1F5EE;
  color: #065F46;
}

.pz-public-policy {
  display: grid;
  gap: 18px;
}

.pz-public-policy h2 {
  margin: 0 0 8px;
  font-size: 19px;
}

.pz-public-policy p,
.pz-public-policy li {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
}

.pz-public-blog-meta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}

.pz-public-shell footer {
  background: #040E1C;
  padding: 60px 80px 40px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.pz-public-shell .footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 48px;
}

.pz-public-shell .footer-brand-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  line-height: 1.7;
  margin-top: 14px;
  max-width: 280px;
}

.pz-public-shell .footer-col-title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 16px;
}

.pz-public-shell .footer-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pz-public-shell .footer-links a {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  transition: color 0.2s;
}

.pz-public-shell .footer-links a:hover {
  color: var(--white);
}

.pz-public-shell .footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.pz-public-shell .footer-copy {
  font-size: 13px;
  color: rgba(255,255,255,0.3);
}

.pz-public-shell .footer-socials {
  display: flex;
  gap: 10px;
}

.pz-public-shell .footer-social {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  text-decoration: none;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}

.pz-public-shell .footer-social:hover {
  color: var(--white);
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.24);
}

.pz-public-shell .footer-social svg {
  width: 15px;
  height: 15px;
}

@media (max-width: 900px) {
  .pz-public-shell nav {
    padding: 0 20px;
    height: 60px;
  }

  .pz-public-shell .nav-toggle {
    display: flex;
  }

  .pz-public-shell .nav-links {
    position: absolute;
    top: 70px;
    left: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    background: rgba(7,29,59,0.98);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 10px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-10px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
  }

  .pz-public-shell .nav-links.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  .pz-public-shell .nav-links a {
    padding: 13px 12px;
    border-radius: 10px;
    font-size: 15px;
    color: rgba(255,255,255,0.78);
  }

  .pz-public-shell .nav-links a:hover {
    background: rgba(255,255,255,0.07);
  }

  .pz-public-shell .nav-cta,
  .pz-public-shell .nav-login {
    display: block;
    text-align: center;
    margin-top: 4px;
    padding: 13px 16px;
  }

  .pz-public-hero,
  .pz-public-section {
    padding-left: 22px;
    padding-right: 22px;
  }

  .pz-public-hero-inner,
  .pz-public-grid.two,
  .pz-public-grid.three {
    grid-template-columns: 1fr;
  }

  .pz-public-shell .footer-top {
    grid-template-columns: 1fr 1fr;
  }

  .pz-public-shell footer {
    padding: 48px 24px 32px;
  }
}

@media (max-width: 560px) {
  .pz-public-shell nav {
    padding: 0 14px;
  }

  .pz-public-shell .nav-logo-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .pz-public-shell .nav-logo-text {
    font-size: 14px;
  }

  .pz-public-shell .nav-toggle {
    width: 36px;
    height: 36px;
    border-radius: 9px;
  }

  .pz-public-shell .nav-links {
    left: 10px;
    right: 10px;
    top: 66px;
  }

  .pz-public-title {
    font-size: 38px;
  }

  .pz-public-mini-grid,
  .pz-public-fields {
    grid-template-columns: 1fr;
  }

  .pz-public-shell .footer-top {
    grid-template-columns: 1fr;
  }

  .pz-public-shell .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="pz-public-shell">
      <style>{PUBLIC_PAGE_CSS}</style>
      <MarketingNav />
      {children}
      <MarketingFooter />
    </main>
  );
}

function MarketingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav>
      <a href="/" className="nav-logo" onClick={closeMenu}>
        <div className="nav-logo-icon">
          <ShieldCheck className="landing-icon shield-svg" style={{ color: "var(--white)" }} aria-hidden="true" />
        </div>
        <span className="nav-logo-text">Pickup Zone</span>
      </a>
      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <a href="/#problem" onClick={closeMenu}>Problem</a>
        <a href="/#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="/#features" onClick={closeMenu}>Features</a>
        <a href="/#pricing" onClick={closeMenu}>Pricing</a>
        <a href="/login" className="nav-login" onClick={closeMenu}>Login</a>
        <a href="/signup" className="nav-cta" onClick={closeMenu}>Register</a>
      </div>
      <button
        className={`nav-toggle ${isOpen ? "active" : ""}`}
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}

function MarketingFooter() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <a href="/" className="nav-logo" style={{ marginBottom: 0 }}>
            <div className="nav-logo-icon">
              <ShieldCheck className="landing-icon shield-svg" style={{ color: "var(--white)" }} aria-hidden="true" />
            </div>
            <span className="nav-logo-text">Pickup Zone</span>
          </a>
          <p className="footer-brand-desc">
            Secure, QR-based student dismissal for modern schools. Built to protect what matters most.
          </p>
        </div>
        <div>
          <div className="footer-col-title">Product</div>
          <div className="footer-links">
            <a href="/#features">Features</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/blogs">Blogs</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          <div className="footer-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cancellation-policy">Cancellation Policy</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">&copy; 2026 Pickup Zone. All rights reserved.</div>
        <div className="footer-socials" aria-label="Social links">
          <a className="footer-social" href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
            <Facebook aria-hidden="true" />
          </a>
          <a className="footer-social" href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
            <Instagram aria-hidden="true" />
          </a>
          <a className="footer-social" href="https://www.linkedin.com" aria-label="LinkedIn" target="_blank" rel="noreferrer">
            <Linkedin aria-hidden="true" />
          </a>
          <a className="footer-social" href="https://www.twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer">
            <Twitter aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function PageHero({
  eyebrow,
  title,
  description,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <section className="pz-public-hero">
      <div className="pz-public-glow" />
      <div className="pz-public-hero-inner">
        <div>
          <div className="pz-public-kicker">
            <ShieldCheck size={15} aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="pz-public-title">
            {title}
            {accent ? <span> {accent}</span> : null}
          </h1>
          <p className="pz-public-subtitle">{description}</p>
        </div>
        <div className="pz-public-hero-card">
          <div className="pz-public-hero-card-title">Pickup Zone Platform</div>
          <div className="pz-public-mini-grid">
            {[
              { icon: QrCode, label: "Encrypted QR" },
              { icon: Building2, label: "Tenant isolation" },
              { icon: BarChart3, label: "Live reports" },
              { icon: UsersRound, label: "Role control" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="pz-public-mini">
                  <Icon aria-hidden="true" />
                  <strong>{item.label}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Platform Features"
        title="Student pickup security"
        accent="built for schools"
        description="Pickup Zone combines encrypted QR access, school-scoped approvals, guard device authorization, parent visibility, and audit-ready reporting."
      />
      <FeaturesSection />
      <HowItWorksSection />
    </PublicShell>
  );
}

export function PricingPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Live Packages"
        title="Pricing that follows"
        accent="Super Admin packages"
        description="This page reads active subscription packages from the backend, so school onboarding always uses the live plan list."
      />
      <section style={{ background: "#071D3B" }}>
        <PricingPlanSection />
      </section>
    </PublicShell>
  );
}

export function AboutPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="About Pickup Zone"
        title="A safer dismissal process"
        accent="for every school day"
        description="Pickup Zone is a multi-tenant SaaS platform for schools that need reliable student pickup verification without paper passes, manual guesswork, or public scan links."
      />
      <section className="pz-public-section">
        <div className="pz-public-container">
          <div className="pz-public-grid three">
            {[
              {
                icon: Building2,
                title: "Built For Schools",
                body: "Each school runs as its own tenant with admins, parents, guards, students, QR codes, pickup logs, and subscription limits scoped to that school.",
              },
              {
                icon: LockKeyhole,
                title: "Security First",
                body: "Encrypted QR tokens, revocation, authorized guard devices, IP checks, approval queues, and final confirmation keep pickup events traceable.",
              },
              {
                icon: BarChart3,
                title: "Operationally Useful",
                body: "Admin dashboards and reports turn pickup logs into trends, risk signals, guard summaries, and exportable evidence.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="pz-public-card">
                  <Icon aria-hidden="true" />
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
          <div className="pz-public-card dark" style={{ marginTop: 28 }}>
            <ShieldCheck aria-hidden="true" />
            <h2>From scan to final exit time</h2>
            <p>
              The core workflow is intentionally simple: a guard scans an encrypted QR code, the school admin
              approves or rejects the request, and the guard confirms when the student enters the vehicle.
            </p>
            <Link to="/features" className="pz-public-button" style={{ marginTop: 18 }}>
              Explore Features
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "";
  const from = searchParams.get("from") || "";
  const isBlockedSupport = from === "blocked" || ["payment", "suspension", "blocked"].includes(reason);
  const defaultSubject = isBlockedSupport ? "Payment support request" : "Contact request";
  const defaultMessage =
    reason === "suspension"
      ? "Hello Pickup Zone team, I need help with my school account access. My school appears to be suspended. Please review and assist."
      : isBlockedSupport
        ? "Hello Pickup Zone team, I need help with my school subscription/payment. My school account appears to be blocked or suspended. Please review and assist."
        : "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: defaultSubject,
    message: defaultMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((current) => ({
      ...current,
      subject: current.subject || defaultSubject,
      message: current.message || defaultMessage,
    }));
  }, [defaultMessage, defaultSubject]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isBlockedSupport) return;

    const loadAdminProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const profile = await response.json();
        const fullName =
          [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
          profile.name ||
          "";

        setForm((current) => ({
          ...current,
          name: current.name || fullName,
          email: current.email || profile.email || "",
          phone: current.phone || profile.phone || "",
          subject: current.subject || defaultSubject,
          message: current.message || defaultMessage,
        }));
      } catch (_err) {
        // Contact stays usable if profile prefill is unavailable.
      }
    };

    loadAdminProfile();
  }, [defaultMessage, defaultSubject, isBlockedSupport]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          source: isBlockedSupport ? "blocked-admin-contact" : "public-contact",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to send inquiry.");
      }

      setSuccess(data.message || "Your inquiry has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to send inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <PageHero
        eyebrow={isBlockedSupport ? "Payment Support" : "Contact"}
        title={isBlockedSupport ? "Need help with billing" : "Talk to the Pickup Zone team"}
        accent={isBlockedSupport ? "or account access?" : ""}
        description="Get help with onboarding, package selection, school setup, guard device registration, payment issues, and rollout planning."
      />
      <section className="pz-public-section alt">
        <div className="pz-public-container pz-public-grid two">
          <div className="pz-public-grid">
            {[
              { icon: Mail, title: "Email", value: "support@pickupzone.com", href: "mailto:support@pickupzone.com" },
              { icon: Phone, title: "Phone", value: "+92 300 1234567", href: "tel:+923001234567" },
              { icon: MapPin, title: "Office", value: "Business Incubation Center, ORIC", href: "" },
            ].map((item) => {
              const Icon = item.icon;
              const content = (
                <article className="pz-public-card">
                  <Icon aria-hidden="true" />
                  <h2>{item.title}</h2>
                  <p style={{ fontWeight: 800 }}>{item.value}</p>
                </article>
              );

              return item.href ? (
                <a key={item.title} href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
                  {content}
                </a>
              ) : (
                <div key={item.title}>{content}</div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="pz-public-card pz-public-form">
            <div className="pz-public-form-head">
              <h2>Send an inquiry</h2>
              <p>Super Admin will receive this message in the platform inquiries page.</p>
            </div>

            <div className="pz-public-fields">
              <label className="pz-public-field">
                Name
                <input
                  className="pz-public-input"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Your name"
                />
              </label>
              <label className="pz-public-field">
                Email
                <input
                  type="email"
                  className="pz-public-input"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@school.edu"
                />
              </label>
              <label className="pz-public-field">
                Mobile
                <input
                  type="tel"
                  className="pz-public-input"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </label>
              <label className="pz-public-field">
                Subject
                <input
                  className="pz-public-input"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="How can we help?"
                />
              </label>
              <label className="pz-public-field full">
                Message
                <textarea
                  className="pz-public-textarea"
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Write your message..."
                />
              </label>
            </div>

            {error && <div className="pz-public-alert error">{error}</div>}
            {success && <div className="pz-public-alert success">{success}</div>}

            <button type="submit" disabled={submitting} className="pz-public-button" style={{ marginTop: 18, border: 0 }}>
              {submitting ? "Sending..." : "Send Inquiry"}
              {!submitting && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}

const policyPages = {
  terms: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    accent: "for Pickup Zone",
    description: "The service terms for schools, admins, families, guardians, and guards using Pickup Zone.",
    sections: [
      {
        title: "Service Use",
        body: "Pickup Zone provides school dismissal, guardian verification, QR-code pickup, reporting, and billing tools for authorized schools. Users must provide accurate account, school, guardian, student, and billing information.",
      },
      {
        title: "School Authorization",
        body: "A School Admin confirms they are authorized to manage the school account, invite users, maintain student and guardian records, and approve subscription billing for that school.",
      },
      {
        title: "Billing Authorization",
        body: "By selecting a package and continuing to payment, the school authorizes recurring monthly or yearly subscription billing. Payment method collection and updates are handled securely through Stripe or an equivalent payment provider.",
      },
      {
        title: "Suspension",
        body: "Access may be limited if a subscription expires, payment fails beyond the configured grace period, or the school is suspended by the platform administrator.",
      },
      {
        title: "Data Responsibility",
        body: "Schools are responsible for keeping student, parent, guardian, custody, and access information accurate. Pickup Zone stores operational records for security, audit, billing, and support purposes.",
      },
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    accent: "for school data",
    description: "How Pickup Zone handles account, school, student, guardian, pickup, billing, and support information.",
    sections: [
      {
        title: "Information We Collect",
        body: "We collect account details, school details, family and guardian contact information, student pickup records, QR verification events, device information, support inquiries, and billing references needed to operate the platform.",
      },
      {
        title: "How We Use Data",
        body: "Data is used to verify pickups, manage users and roles, enforce package limits, support billing, provide audit logs, respond to support requests, and improve the reliability and security of the service.",
      },
      {
        title: "Student Privacy",
        body: "Student data is used only for school dismissal and related administrative workflows. Access is role-based and scoped to the school tenant.",
      },
      {
        title: "Sharing",
        body: "We do not sell school or student data. We may share limited information with service providers such as payment processors, hosting providers, email providers, or security tools when needed to operate the system.",
      },
      {
        title: "Security & Retention",
        body: "Pickup Zone uses role-based access, encrypted transport, tenant isolation, and audit logs. Records are retained as needed for school operations, legal, billing, and security requirements.",
      },
    ],
  },
  cancellation: {
    eyebrow: "Billing",
    title: "Cancellation Policy",
    accent: "and subscription changes",
    description: "How package changes, cancellations, billing retries, grace periods, and suspension are handled.",
    sections: [
      {
        title: "Subscription Renewal",
        body: "Subscriptions renew automatically on the selected monthly or yearly billing interval unless cancelled before renewal.",
      },
      {
        title: "Cancellation",
        body: "A subscription may be cancelled through billing support or by the authorized platform administrator. When cancellation is scheduled for the period end, access remains active until the paid period expires.",
      },
      {
        title: "Upgrades & Downgrades",
        body: "Package upgrades may apply immediately and may include prorated billing. Downgrades may be scheduled for the next billing cycle when needed to avoid disrupting current school usage.",
      },
      {
        title: "Failed Payments",
        body: "Failed payments may trigger reminders and automated retries. If payment remains unresolved beyond the grace period, school access may be suspended until billing is resolved.",
      },
      {
        title: "Support",
        body: "Schools with payment issues can use the Contact page to send a billing inquiry. The Super Admin inquiry inbox receives and tracks these requests.",
      },
    ],
  },
} as const;

function PolicyPage({ type }: { type: keyof typeof policyPages }) {
  const page = policyPages[type];
  return (
    <PublicShell>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        accent={page.accent}
        description={page.description}
      />
      <section className="pz-public-section alt">
        <div className="pz-public-container">
          <article className="pz-public-card pz-public-policy">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            <section>
              <h2>Contact</h2>
              <p>
                Questions about this policy can be sent through the <Link to="/contact">Contact page</Link>.
              </p>
            </section>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}

export function TermsConditionsPage() {
  return <PolicyPage type="terms" />;
}

export function PrivacyPolicyPage() {
  return <PolicyPage type="privacy" />;
}

export function CancellationPolicyPage() {
  return <PolicyPage type="cancellation" />;
}

export function BlogsPage() {
  const posts = [
    {
      icon: ShieldCheck,
      title: "Why paper pickup lists create avoidable risk",
      date: "May 3, 2026",
      body: "A practical look at how schools can replace paper lists and verbal confirmation with verified release workflows.",
    },
    {
      icon: QrCode,
      title: "How encrypted QR pickup improves dismissal speed",
      date: "May 3, 2026",
      body: "QR verification gives guards and admins a faster way to confirm identity while preserving a detailed audit trail.",
    },
    {
      icon: CreditCard,
      title: "Managing package limits without disrupting school operations",
      date: "May 3, 2026",
      body: "Usage indicators, feature toggles, and clear billing workflows help schools understand their plan before limits become blockers.",
    },
    {
      icon: Database,
      title: "What schools should expect from dismissal audit logs",
      date: "May 3, 2026",
      body: "Strong pickup records should show who scanned, who approved, which student was released, and when the pickup was completed.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Blogs"
        title="School pickup insights"
        accent="from Pickup Zone"
        description="Guides and product notes for safer dismissal, better billing workflows, and clearer school operations."
      />
      <section className="pz-public-section alt">
        <div className="pz-public-container pz-public-grid three">
          {posts.map((post) => {
            const Icon = post.icon;
            return (
              <article key={post.title} className="pz-public-card">
                <div className="pz-public-blog-meta">
                  <CalendarDays size={14} aria-hidden="true" />
                  {post.date}
                </div>
                <Icon aria-hidden="true" />
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <Link to="/contact" className="pz-public-button ghost" style={{ marginTop: 16 }}>
                  Talk to us
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
