import { useEffect } from 'react'

const HOME_PAGE_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Pickup Zone — Secure Student Dismissal</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #071D3B;
    --navy-mid: #0B2E5A;
    --navy-light: #123b75;
    --blue: #1B6ECC;
    --blue-light: #3D8FE8;
    --teal: #1A9E75;
    --teal-light: #2DC98F;
    --teal-pale: #E1F5EE;
    --amber: #EF9F27;
    --red: #E24B4A;
    --white: #FFFFFF;
    --off-white: #F5F7FA;
    --surface: #EFF3F9;
    --text-primary: #0A1628;
    --text-secondary: #4A5568;
    --text-muted: #8A96A8;
    --border: rgba(10,22,40,0.1);
    --border-light: rgba(255,255,255,0.1);
    --font-display: 'Inter', 'Segoe UI', Arial, sans-serif;
    --font-body: 'Inter', 'Segoe UI', Arial, sans-serif;
  }

  html {
    scroll-behavior: smooth;
    scrollbar-width: none;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  body {
    font-family: var(--font-body);
    color: var(--text-primary);
    background: var(--white);
    overflow-x: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;
    -webkit-font-smoothing: antialiased;
  }

  /* ── NAV ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 64px;
    background: rgba(7,29,59,0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-light);
    transition: all 0.3s ease;
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .nav-logo-icon {
    width: 34px; height: 34px; background: var(--teal);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .shield-svg { width: 18px; height: 18px; }
  .landing-icon {
    width: 1em;
    height: 1em;
    display: block;
    color: currentColor;
    stroke-width: 2.2;
  }
  .problem-icon .landing-icon,
  .hiw-step-icon-box .landing-icon,
  .feat-icon .landing-icon,
  .role-avatar .landing-icon,
  .security-icon-box .landing-icon,
  .cert-icon .landing-icon {
    width: 22px;
    height: 22px;
  }
  .role-avatar .landing-icon {
    width: 24px;
    height: 24px;
  }
  .cert-icon .landing-icon {
    width: 28px;
    height: 28px;
  }
  .nav-logo-text {
    font-family: var(--font-display); font-size: 18px; font-weight: 700;
    color: var(--white); letter-spacing: -0.02em;
  }
  .nav-links { display: flex; align-items: center; gap: 32px; }
  .nav-links a {
    color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 400;
    text-decoration: none; transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-cta {
    background: var(--teal); color: var(--white) !important;
    padding: 8px 20px; border-radius: 8px; font-weight: 500 !important;
    transition: background 0.2s !important;
  }
  .nav-cta:hover { background: var(--teal-light) !important; }
  .nav-login {
    color: var(--white) !important;
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 8px;
    padding: 8px 18px;
    font-weight: 500 !important;
  }
  .nav-login:hover { background: rgba(255,255,255,0.08); }
  .nav-toggle {
    display: none;
    width: 42px; height: 42px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 10px;
    background: rgba(255,255,255,0.07);
    cursor: pointer;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 5px;
  }
  .nav-toggle span {
    width: 18px; height: 2px;
    background: var(--white);
    border-radius: 999px;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .nav-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .nav-toggle.active span:nth-child(2) { opacity: 0; }
  .nav-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    background: var(--navy);
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 40px 80px;
    text-align: center;
  }

  /* grid pattern */
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  /* radial glow */
  .hero-glow {
    position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 600px;
    background: radial-gradient(ellipse at center, rgba(26,158,117,0.18) 0%, rgba(27,110,204,0.10) 45%, transparent 70%);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(26,158,117,0.15); border: 1px solid rgba(26,158,117,0.35);
    color: var(--teal-light); font-size: 12px; font-weight: 500; letter-spacing: 0.05em;
    padding: 6px 14px; border-radius: 100px;
    margin-bottom: 28px; position: relative;
    animation: fadeUp 0.6s ease both;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; background: var(--teal-light);
    border-radius: 50%; animation: pulse 2s infinite;
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(50px, 7.2vw, 88px);
    font-weight: 700; color: var(--white);
    line-height: 1.08; letter-spacing: -0.025em;
    max-width: 900px; margin-bottom: 24px;
    position: relative;
    animation: fadeUp 0.7s 0.1s ease both;
  }
  .hero-title .accent { color: var(--teal-light); }
  .hero-title .underline-word {
    position: relative; display: inline-block;
  }
  .hero-title .underline-word::after {
    content: '';
    position: absolute; bottom: 4px; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, var(--teal), var(--blue-light));
    border-radius: 2px;
  }

  .hero-sub {
    font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.6);
    line-height: 1.7; max-width: 580px; margin: 0 auto 40px;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .hero-actions {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    animation: fadeUp 0.7s 0.3s ease both;
    margin-bottom: 64px;
  }
  .btn-primary {
    background: var(--teal); color: var(--white);
    padding: 14px 28px; border-radius: 10px;
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    border: none; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.2s; box-shadow: 0 0 0 0 rgba(26,158,117,0.4);
  }
  .btn-primary:hover {
    background: var(--teal-light);
    box-shadow: 0 4px 24px rgba(26,158,117,0.35);
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.07); color: var(--white);
    padding: 14px 28px; border-radius: 10px;
    font-family: var(--font-body); font-size: 15px; font-weight: 400;
    border: 1px solid rgba(255,255,255,0.15); cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }

  /* Hero mockup card */
  .hero-mockup {
    position: relative; max-width: 720px; width: 100%;
    animation: fadeUp 0.8s 0.4s ease both;
  }
  .mockup-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px; overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .mockup-bar {
    background: rgba(255,255,255,0.06);
    padding: 12px 20px;
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .mockup-dots { display: flex; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-r { background: #FF5F56; }
  .dot-y { background: #FFBD2E; }
  .dot-g { background: #27C93F; }
  .mockup-url {
    flex: 1; background: rgba(255,255,255,0.08); border-radius: 6px;
    padding: 5px 12px; font-size: 12px; color: rgba(255,255,255,0.45);
    font-family: var(--font-body);
  }
  .mockup-body { padding: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
  .mockup-stat {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 14px;
  }
  .mockup-stat-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
  .mockup-stat-val { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--white); }
  .mockup-stat-val.green { color: var(--teal-light); }
  .mockup-stat-val.amber { color: var(--amber); }
  .mockup-stat-val.red { color: #FF7A78; }
  .mockup-scan-row {
    grid-column: 1 / -1;
    background: rgba(26,158,117,0.1); border: 1px solid rgba(26,158,117,0.2);
    border-radius: 10px; padding: 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .mockup-scan-left { display: flex; align-items: center; gap: 10px; }
  .scan-avatar-small {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--teal); display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: var(--white);
  }
  .scan-text-name { font-size: 13px; font-weight: 500; color: var(--white); }
  .scan-text-detail { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }
  .scan-approve-btn {
    background: var(--teal); color: var(--white);
    border: none; border-radius: 7px; padding: 7px 16px;
    font-size: 12px; font-weight: 500; cursor: pointer;
    animation: approveGlow 3s infinite;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .scan-approve-btn .landing-icon {
    width: 13px; height: 13px;
  }

  /* ── STATS BAR ── */
  .stats-bar {
    background: var(--navy-mid);
    padding: 40px 80px;
    display: grid; grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .stat-item { text-align: center; padding: 0 20px; }
  .stat-item + .stat-item { border-left: 1px solid rgba(255,255,255,0.08); }
  .stat-num {
    font-family: var(--font-display); font-size: 50px; font-weight: 700;
    color: var(--white); line-height: 1; margin-bottom: 6px;
  }
  .stat-num span { color: var(--teal-light); }
  .stat-desc { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 300; }

  /* ── SECTION COMMON ── */
  section { padding: 100px 80px; }
  .section-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--teal); margin-bottom: 16px;
  }
  .section-tag::before {
    content: ''; width: 20px; height: 2px; background: var(--teal);
  }
  .section-title {
    font-family: var(--font-display); font-size: clamp(30px, 4vw, 48px);
    font-weight: 700; color: var(--text-primary); line-height: 1.1;
    letter-spacing: -0.025em; margin-bottom: 16px;
  }
  .section-title.light { color: var(--white); }
  .section-sub {
    font-size: 17px; font-weight: 300; color: var(--text-secondary);
    line-height: 1.7; max-width: 520px;
  }
  .section-sub.light { color: rgba(255,255,255,0.55); }

  /* ── PROBLEM ── */
  .problem { background: var(--off-white); }
  .problem-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items: center; margin-top: 64px;
  }
  .problem-cards { display: flex; flex-direction: column; gap: 14px; }
  .problem-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 22px 24px;
    display: flex; align-items: flex-start; gap: 16px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .problem-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.07); }
  .problem-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 18px;
  }
  .problem-icon.red { background: #FDEAEA; }
  .problem-icon.amber { background: #FEF3DC; }
  .problem-card-title { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
  .problem-card-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
  .problem-visual {
    position: relative; display: flex; flex-direction: column; gap: 14px;
  }
  .old-method {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 24px;
  }
  .old-method-label {
    font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 14px;
  }
  .old-method-list { display: flex; flex-direction: column; gap: 10px; }
  .old-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: var(--text-secondary);
    text-decoration: line-through; opacity: 0.6;
  }
  .old-item::before { content: '✕'; color: var(--red); font-size: 12px; font-weight: 600; }
  .vs-badge {
    align-self: center; background: var(--navy);
    color: var(--white); font-family: var(--font-display);
    font-size: 12px; font-weight: 700; padding: 6px 16px;
    border-radius: 100px; letter-spacing: 0.05em;
  }
  .new-method {
    background: var(--navy); border: 1px solid rgba(26,158,117,0.3);
    border-radius: 14px; padding: 20px 24px;
    box-shadow: 0 0 40px rgba(26,158,117,0.1);
  }
  .new-method-label {
    font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--teal-light); margin-bottom: 14px;
  }
  .new-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: rgba(255,255,255,0.85); margin-bottom: 10px;
  }
  .new-item > .landing-icon {
    color: var(--teal-light);
    background: rgba(26,158,117,0.15); width: 20px; height: 20px;
    border-radius: 50%; padding: 4px; flex-shrink: 0;
  }

  /* ── HOW IT WORKS ── */
  .hiw { background: var(--navy); position: relative; overflow: hidden; }
  .hiw::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .hiw-header { max-width: 560px; margin-bottom: 64px; position: relative; }
  .hiw-steps {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 0; position: relative;
  }
  .hiw-steps::before {
    content: '';
    position: absolute; top: 40px; left: calc(16.66% + 20px); right: calc(16.66% + 20px);
    height: 1px; background: linear-gradient(90deg, var(--teal), var(--blue-light), var(--teal));
    opacity: 0.4;
  }
  .hiw-step {
    padding: 0 32px; position: relative; text-align: center;
  }
  .step-number-wrap {
    width: 80px; height: 80px; margin: 0 auto 24px;
    position: relative;
  }
  .step-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(26,158,117,0.3);
  }
  .step-ring-inner {
    position: absolute; inset: 8px; border-radius: 50%;
    background: var(--navy-mid); border: 1px solid rgba(26,158,117,0.5);
    display: flex; align-items: center; justify-content: center;
  }
  .step-num {
    font-family: var(--font-display); font-size: 22px; font-weight: 700;
    color: var(--teal-light);
  }
  .step-icon { font-size: 28px; margin-bottom: 12px; display: block; }
  .step-title {
    font-family: var(--font-display); font-size: 18px; font-weight: 600;
    color: var(--white); margin-bottom: 10px;
  }
  .step-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; }

  /* extended step row */
  .hiw-steps-extended {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 40px;
  }
  .hiw-step-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 28px; text-align: left;
  }
  .hiw-step-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(26,158,117,0.25); }
  .hiw-step-card-num {
    font-family: var(--font-display); font-size: 40px; font-weight: 700;
    color: rgba(255,255,255,0.06); line-height: 1; margin-bottom: 16px;
  }
  .hiw-step-icon-box {
    width: 44px; height: 44px; border-radius: 11px;
    background: rgba(26,158,117,0.15); border: 1px solid rgba(26,158,117,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 16px;
  }
  .hiw-step-title { font-size: 16px; font-weight: 500; color: var(--white); margin-bottom: 8px; }
  .hiw-step-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.7; }

  /* ── FEATURES ── */
  .features { background: var(--white); }
  .features-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 56px; flex-wrap: wrap; gap: 20px; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .feat-card {
    border: 1px solid var(--border); border-radius: 18px;
    padding: 32px; transition: all 0.25s;
    position: relative; overflow: hidden;
  }
  .feat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--teal), var(--blue-light));
    opacity: 0; transition: opacity 0.25s;
  }
  .feat-card:hover { border-color: rgba(26,158,117,0.25); box-shadow: 0 12px 40px rgba(0,0,0,0.06); transform: translateY(-3px); }
  .feat-card:hover::before { opacity: 1; }
  .feat-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 20px;
  }
  .feat-title { font-family: var(--font-display); font-size: 17px; font-weight: 600; margin-bottom: 10px; }
  .feat-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
  .feat-card.featured {
    background: var(--navy); border-color: transparent;
    box-shadow: 0 20px 60px rgba(7,29,59,0.2);
  }
  .feat-card.featured .feat-title { color: var(--white); }
  .feat-card.featured .feat-desc { color: rgba(255,255,255,0.5); }
  .feat-card.featured::before { opacity: 1; }

  /* ── ROLES ── */
  .roles { background: var(--surface); }
  .roles-header { margin-bottom: 56px; }
  .roles-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
  .role-card-v2 {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; padding: 28px 20px; text-align: center;
    transition: all 0.25s; cursor: default;
  }
  .role-card-v2:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }
  .role-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .role-name-v2 { font-family: var(--font-display); font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .role-tagline { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; }
  .role-pill {
    display: inline-block; font-size: 10px; font-weight: 500;
    padding: 3px 10px; border-radius: 100px; letter-spacing: 0.04em;
  }

  /* ── PRICING ── */
  .pricing { background: var(--navy); position: relative; overflow: hidden; }
  .pricing::after {
    content: '';
    position: absolute; bottom: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(26,158,117,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .pricing-header { text-align: center; margin-bottom: 56px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
  .plan-card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 36px 32px;
    display: flex; flex-direction: column;
    transition: all 0.25s;
  }
  .plan-card:hover { background: rgba(255,255,255,0.08); }
  .plan-card.popular {
    background: var(--teal); border-color: var(--teal);
    box-shadow: 0 20px 60px rgba(26,158,117,0.25);
    transform: scale(1.03);
  }
  .plan-badge {
    display: inline-block; font-size: 10px; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    background: rgba(255,255,255,0.2); color: var(--white);
    padding: 4px 12px; border-radius: 100px; margin-bottom: 20px;
    align-self: flex-start;
  }
  .plan-name {
    font-family: var(--font-display); font-size: 20px; font-weight: 700;
    color: var(--white); margin-bottom: 8px;
  }
  .plan-desc { font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 28px; }
  .plan-price { margin-bottom: 28px; }
  .plan-price-num {
    font-family: var(--font-display); font-size: 44px; font-weight: 700;
    color: var(--white); line-height: 1;
  }
  .plan-price-per { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; }
  .plan-divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; }
  .plan-features { display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .plan-feature {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,0.8);
  }
  .plan-check { color: var(--teal-light); margin-top: 1px; flex-shrink: 0; }
  .plan-check .landing-icon { width: 14px; height: 14px; }
  .plan-card.popular .plan-check { color: var(--white); }
  .plan-cta {
    margin-top: 28px; padding: 13px;
    border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.3);
    background: transparent; color: var(--white);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; text-align: center;
    text-decoration: none; display: block;
  }
  .plan-cta:hover { background: rgba(255,255,255,0.1); }
  .plan-card.popular .plan-cta {
    background: var(--white); color: var(--teal);
    border-color: var(--white);
  }
  .plan-card.popular .plan-cta:hover { background: rgba(255,255,255,0.9); }

  /* ── SECURITY ── */
  .security { background: var(--white); }
  .security-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .security-list { display: flex; flex-direction: column; gap: 20px; margin-top: 36px; }
  .security-item { display: flex; gap: 16px; align-items: flex-start; }
  .security-icon-box {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 18px;
  }
  .security-item-title { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
  .security-item-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
  .security-cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .cert-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 22px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
  }
  .cert-icon { font-size: 28px; }
  .cert-title { font-size: 14px; font-weight: 500; }
  .cert-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; }

  /* ── CTA STRIP ── */
  .cta-strip {
    background: var(--teal);
    padding: 80px; text-align: center;
    position: relative; overflow: hidden;
  }
  .cta-strip::before {
    content: '';
    position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .cta-title {
    font-family: var(--font-display); font-size: clamp(30px, 4vw, 50px);
    font-weight: 700; color: var(--white); letter-spacing: -0.02em;
    margin-bottom: 16px; position: relative;
  }
  .cta-sub { font-size: 17px; color: rgba(255,255,255,0.75); font-weight: 300; margin-bottom: 36px; }
  .btn-cta-white {
    background: var(--white); color: var(--teal);
    padding: 15px 32px; border-radius: 10px;
    font-family: var(--font-body); font-size: 16px; font-weight: 600;
    border: none; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  }
  .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.2); }

  /* ── FOOTER ── */
  footer {
    background: #040E1C;
    padding: 60px 80px 40px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  .footer-brand-desc { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.7; margin-top: 14px; max-width: 280px; }
  .footer-col-title { font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 16px; }
  .footer-links { display: flex; flex-direction: column; gap: 10px; }
  .footer-links a { font-size: 14px; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--white); }
  .footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;
    flex-wrap: wrap; gap: 12px;
  }
  .footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }
  .footer-socials { display: flex; gap: 10px; }
  .footer-social {
    width: 32px; height: 32px;
    display: inline-flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.4);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
    text-decoration: none;
    transition: color 0.2s, background 0.2s, border-color 0.2s;
  }
  .footer-social:hover {
    color: var(--white);
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.24);
  }
  .footer-social .landing-icon {
    width: 15px; height: 15px;
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  @keyframes approveGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(26,158,117,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(26,158,117,0); }
  }
  @keyframes countUp {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .reveal {
    opacity: 0; transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible {
    opacity: 1; transform: translateY(0);
  }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  /* responsive basics */
  @media (max-width: 900px) {
    nav { padding: 0 20px; height: 60px; }
    .nav-toggle { display: flex; }
    .nav-links {
      position: absolute; top: 70px; left: 16px; right: 16px;
      display: flex; flex-direction: column; align-items: stretch; gap: 4px;
      background: rgba(7,29,59,0.98);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 18px 50px rgba(0,0,0,0.28);
      opacity: 0; visibility: hidden; pointer-events: none;
      transform: translateY(-10px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
    }
    .nav-links.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transform: translateY(0);
    }
    .nav-links a {
      padding: 13px 12px;
      border-radius: 10px;
      font-size: 15px;
      color: rgba(255,255,255,0.78);
    }
    .nav-links a:hover { background: rgba(255,255,255,0.07); }
    .nav-cta {
      display: block;
      text-align: center;
      margin-top: 4px;
      padding: 13px 16px;
    }
    .nav-login {
      display: block;
      text-align: center;
      margin-top: 4px;
      padding: 13px 16px;
    }
    section { padding: 64px 24px; }
    .hero {
      min-height: auto;
      padding: 96px 20px 54px;
    }
    .hero-glow {
      width: 420px; height: 360px;
      top: -80px;
    }
    .hero-badge {
      font-size: 11px;
      padding: 6px 12px;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: clamp(38px, 11vw, 56px);
      line-height: 1.08;
      max-width: 360px;
      margin-bottom: 18px;
    }
    .hero-title .underline-word::after {
      bottom: 2px;
      height: 3px;
    }
    .hero-sub {
      font-size: 15px;
      line-height: 1.6;
      max-width: 360px;
      margin-bottom: 28px;
    }
    .hero-actions {
      flex-direction: column;
      align-items: center;
      margin-bottom: 36px;
    }
    .btn-primary,
    .btn-ghost {
      width: 100%;
      max-width: 240px;
      justify-content: center;
      padding: 12px 18px;
      font-size: 13px;
    }
    .hero-mockup { max-width: 360px; }
    .mockup-card { border-radius: 14px; }
    .mockup-bar {
      padding: 10px 12px;
      gap: 8px;
    }
    .mockup-url {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
    }
    .mockup-body {
      padding: 12px;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .mockup-stat {
      padding: 10px;
      border-radius: 8px;
    }
    .mockup-stat-label { font-size: 10px; }
    .mockup-stat-val { font-size: 18px; }
    .mockup-scan-row {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      padding: 12px;
    }
    .mockup-scan-left {
      align-items: flex-start;
    }
    .scan-text-name { font-size: 12px; }
    .scan-text-detail { font-size: 10px; line-height: 1.45; }
    .scan-approve-btn {
      width: 100%;
      padding: 8px 12px;
    }
    .stats-bar { grid-template-columns: repeat(2, 1fr); padding: 32px 24px; }
    .problem-grid, .security-inner { grid-template-columns: 1fr; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .roles-grid { grid-template-columns: repeat(3, 1fr); }
    .pricing-grid { grid-template-columns: 1fr; }
    .plan-card.popular { transform: none; }
    .footer-top { grid-template-columns: 1fr 1fr; }
    footer { padding: 48px 24px 32px; }
    .hiw-steps-extended { grid-template-columns: 1fr; }
    .cta-strip { padding: 60px 24px; }
  }

  @media (max-width: 520px) {
    nav { padding: 0 14px; }
    .nav-logo-icon { width: 30px; height: 30px; border-radius: 8px; }
    .nav-logo-text { font-size: 14px; }
    .nav-toggle { width: 36px; height: 36px; border-radius: 9px; }
    .nav-links { left: 10px; right: 10px; top: 66px; }
    section { padding: 56px 18px; }
    .hero {
      padding: 88px 16px 46px;
    }
    .hero-title {
      font-size: clamp(34px, 13vw, 46px);
      max-width: 330px;
    }
    .hero-sub {
      font-size: 13px;
      max-width: 300px;
    }
    .hero-badge {
      font-size: 10px;
      max-width: 100%;
      text-align: center;
    }
    .stats-bar {
      grid-template-columns: 1fr;
      padding: 26px 18px;
    }
    .stat-item {
      padding: 18px 0;
      border-left: none !important;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .stat-item:last-child { border-bottom: none; }
    .features-grid,
    .roles-grid,
    .security-cert-grid,
    .footer-top {
      grid-template-columns: 1fr;
    }
    .features-header {
      align-items: flex-start;
      margin-bottom: 34px;
    }
    .feat-card,
    .hiw-step-card,
    .plan-card {
      padding: 24px;
    }
    .problem-grid { gap: 34px; margin-top: 36px; }
    .footer-bottom {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="/" class="nav-logo">
    <div class="nav-logo-icon">
      <i data-lucide="shield-check" class="landing-icon shield-svg" style="color:var(--white);"></i>
    </div>
    <span class="nav-logo-text">Pickup Zone</span>
  </a>
  <div class="nav-links">
    <a href="#problem">Problem</a>
    <a href="#how-it-works">How It Works</a>
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="/login" class="nav-login">Login</a>
    <a href="/signup" class="nav-cta">Register</a>
  </div>
  <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
    <span></span>
    <span></span>
    <span></span>
  </button>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-glow"></div>

  <div class="hero-badge">
    <div class="hero-badge-dot"></div>
    Trusted by 200+ schools across the US
  </div>

  <h1 class="hero-title">
    Every Pickup.<br>
    <span class="accent">Verified.</span>
    <span class="underline-word"> Every Time.</span>
  </h1>

  <p class="hero-sub">
    Pickup Zone replaces paper lists and verbal confirmations with a secure, QR-based student release system — so only authorized guardians ever leave with your students.
  </p>

  <div class="hero-actions">
    <a href="/signup" class="btn-primary">
      <i data-lucide="shield-check" class="landing-icon"></i>
      Get Started Free
    </a>
    <a href="#how-it-works" class="btn-ghost">
      See How It Works
      <i data-lucide="arrow-right" class="landing-icon"></i>
    </a>
  </div>

  <div class="hero-mockup">
    <div class="mockup-card">
      <div class="mockup-bar">
        <div class="mockup-dots">
          <div class="dot dot-r"></div>
          <div class="dot dot-y"></div>
          <div class="dot dot-g"></div>
        </div>
        <div class="mockup-url">School Admin Dashboard</div>
      </div>
      <div class="mockup-body">
        <div class="mockup-stat">
          <div class="mockup-stat-label">Released today</div>
          <div class="mockup-stat-val green">247</div>
        </div>
        <div class="mockup-stat">
          <div class="mockup-stat-label">Pending</div>
          <div class="mockup-stat-val amber">3</div>
        </div>
        <div class="mockup-stat">
          <div class="mockup-stat-label">Active QR codes</div>
          <div class="mockup-stat-val">512</div>
        </div>
        <div class="mockup-stat">
          <div class="mockup-stat-label">Alerts</div>
          <div class="mockup-stat-val red">0</div>
        </div>
        <div class="mockup-scan-row">
          <div class="mockup-scan-left">
            <div class="scan-avatar-small">SJ</div>
            <div>
              <div class="scan-text-name">Sarah Johnson • QR Verified <i data-lucide="badge-check" class="landing-icon" style="display:inline-block;width:13px;height:13px;color:var(--teal-light);vertical-align:-2px;"></i></div>
              <div class="scan-text-detail">Authorized to pick up: Emma Johnson (Grade 3) · Gate A · 2:41 PM</div>
            </div>
          </div>
          <button class="scan-approve-btn">Approve Release <i data-lucide="arrow-right" class="landing-icon"></i></button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STATS BAR -->
<div class="stats-bar">
  <div class="stat-item reveal">
    <div class="stat-num"><span>200</span>+</div>
    <div class="stat-desc">Schools protected</div>
  </div>
  <div class="stat-item reveal reveal-delay-1">
    <div class="stat-num"><span>1.2</span>M+</div>
    <div class="stat-desc">Safe pickups logged</div>
  </div>
  <div class="stat-item reveal reveal-delay-2">
    <div class="stat-num"><span>99.9</span>%</div>
    <div class="stat-desc">System uptime</div>
  </div>
  <div class="stat-item reveal reveal-delay-3">
    <div class="stat-num"><span>0</span></div>
    <div class="stat-desc">Unauthorized pickups since launch</div>
  </div>
</div>

<!-- PROBLEM -->
<section class="problem" id="problem">
  <div class="section-tag">The Problem</div>
  <div class="problem-grid">
    <div>
      <h2 class="section-title">Traditional pickup systems put children at risk</h2>
      <p class="section-sub">Schools still rely on paper lists, verbal confirmation, and human memory — methods that are dangerously easy to exploit.</p>
      <div class="problem-cards" style="margin-top: 36px;">
        <div class="problem-card reveal">
          <div class="problem-icon red"><i data-lucide="siren" class="landing-icon" style="color:var(--red);"></i></div>
          <div>
            <div class="problem-card-title">Unauthorized pickups</div>
            <div class="problem-card-desc">Non-custodial parents and strangers can exploit weak identity checks to take children without authorization.</div>
          </div>
        </div>
        <div class="problem-card reveal reveal-delay-1">
          <div class="problem-icon amber"><i data-lucide="triangle-alert" class="landing-icon" style="color:var(--amber);"></i></div>
          <div>
            <div class="problem-card-title">Custody violations</div>
            <div class="problem-card-desc">Schools have no reliable way to enforce court-ordered custody arrangements during dismissal.</div>
          </div>
        </div>
        <div class="problem-card reveal reveal-delay-2">
          <div class="problem-icon red"><i data-lucide="clipboard-x" class="landing-icon" style="color:var(--red);"></i></div>
          <div>
            <div class="problem-card-title">No audit trail</div>
            <div class="problem-card-desc">Paper logs and verbal records can't stand up to legal scrutiny or post-incident investigation.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="problem-visual reveal">
      <div class="old-method">
        <div class="old-method-label">Old Way</div>
        <div class="old-method-list">
          <div class="old-item">Paper pickup lists at front desk</div>
          <div class="old-item">Verbal confirmation by staff</div>
          <div class="old-item">Security guard recognition</div>
          <div class="old-item">Manual paper logs</div>
        </div>
      </div>
      <div style="display:flex; justify-content:center;">
        <div class="vs-badge">VS</div>
      </div>
      <div class="new-method">
        <div class="new-method-label">Pickup Zone</div>
        <div class="new-item"><i data-lucide="check" class="landing-icon"></i>Encrypted unique QR per guardian</div>
        <div class="new-item"><i data-lucide="check" class="landing-icon"></i>Real-time admin approval workflow</div>
        <div class="new-item"><i data-lucide="check" class="landing-icon"></i>Device-restricted scanning</div>
        <div class="new-item"><i data-lucide="check" class="landing-icon"></i>Full digital audit trail</div>
        <div class="new-item"><i data-lucide="check" class="landing-icon"></i>Instant QR revocation capability</div>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="hiw" id="how-it-works">
  <div class="hiw-header">
    <div class="section-tag" style="color:var(--teal-light);">How It Works</div>
    <h2 class="section-title light">Six steps from arrival<br>to safe release</h2>
    <p class="section-sub light">A verified, multi-layer workflow that protects every student on every pickup.</p>
  </div>

  <div class="hiw-steps-extended">
    <div class="hiw-step-card reveal">
      <div class="hiw-step-card-num">01</div>
      <div class="hiw-step-icon-box"><i data-lucide="users-round" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Parent Enrollment</div>
      <div class="hiw-step-desc">Parents register, add students, and assign up to 2 authorized guardians. The system generates a unique encrypted QR for each person.</div>
    </div>
    <div class="hiw-step-card reveal reveal-delay-1">
      <div class="hiw-step-card-num">02</div>
      <div class="hiw-step-icon-box"><i data-lucide="car-front" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Arrival at School</div>
      <div class="hiw-step-desc">The parent or guardian arrives and presents their QR code — on a printed card, phone screen, or windshield tag.</div>
    </div>
    <div class="hiw-step-card reveal reveal-delay-2">
      <div class="hiw-step-card-num">03</div>
      <div class="hiw-step-icon-box"><i data-lucide="smartphone" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Guard Scans QR</div>
      <div class="hiw-step-desc">The security guard scans using a device locked to an approved IP address. The system instantly verifies identity and authorized students.</div>
    </div>
    <div class="hiw-step-card reveal">
      <div class="hiw-step-card-num">04</div>
      <div class="hiw-step-icon-box"><i data-lucide="bell-ring" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Admin Notified</div>
      <div class="hiw-step-desc">A real-time notification reaches the school admin, showing guardian name, photo, student name, and timestamp.</div>
    </div>
    <div class="hiw-step-card reveal reveal-delay-1">
      <div class="hiw-step-card-num">05</div>
      <div class="hiw-step-icon-box"><i data-lucide="badge-check" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Admin Approves</div>
      <div class="hiw-step-desc">Admin approves the release with a single tap. The student is sent to the pickup zone and status is updated to "Released."</div>
    </div>
    <div class="hiw-step-card reveal reveal-delay-2">
      <div class="hiw-step-card-num">06</div>
      <div class="hiw-step-icon-box"><i data-lucide="shield-check" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="hiw-step-title">Guard Confirms Exit</div>
      <div class="hiw-step-desc">Guard confirms the student entered the vehicle and exited campus. A full audit log entry is created and stored permanently.</div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="features" id="features">
  <div class="features-header">
    <div>
      <div class="section-tag">Features</div>
      <h2 class="section-title">Everything a school needs.<br>Nothing it doesn't.</h2>
    </div>
    <p class="section-sub" style="max-width:320px;">Purpose-built for school dismissal — not a generic tool bolted onto a different use case.</p>
  </div>
  <div class="features-grid">
    <div class="feat-card featured reveal">
      <div class="feat-icon" style="background:rgba(26,158,117,0.2);"><i data-lucide="lock-keyhole" class="landing-icon" style="color:var(--teal-light);"></i></div>
      <div class="feat-title">Encrypted QR Codes</div>
      <div class="feat-desc">Every QR is token-encrypted, expiration-capable, and can be revoked instantly if a custody situation changes. No duplicate codes, ever.</div>
    </div>
    <div class="feat-card reveal reveal-delay-1">
      <div class="feat-icon" style="background:#E1F5EE;"><i data-lucide="zap" class="landing-icon" style="color:var(--teal);"></i></div>
      <div class="feat-title">Real-Time Approval</div>
      <div class="feat-desc">Admin gets a push notification the moment a QR is scanned. One-tap approve or deny — no phone tag with office staff.</div>
    </div>
    <div class="feat-card reveal reveal-delay-2">
      <div class="feat-icon" style="background:#E6F1FB;"><i data-lucide="chart-no-axes-combined" class="landing-icon" style="color:var(--blue);"></i></div>
      <div class="feat-title">Full Audit Trail</div>
      <div class="feat-desc">Every scan, approval, denial, and confirmation is logged with timestamps, device info, and user IDs — exportable to PDF or CSV.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon" style="background:#FEF3DC;"><i data-lucide="building-2" class="landing-icon" style="color:var(--amber);"></i></div>
      <div class="feat-title">Multi-Branch Support</div>
      <div class="feat-desc">Manage multiple campuses under one subscription. Each school operates in an isolated tenant environment with its own admin panel.</div>
    </div>
    <div class="feat-card reveal reveal-delay-1">
      <div class="feat-icon" style="background:#FDEAEA;"><i data-lucide="siren" class="landing-icon" style="color:var(--red);"></i></div>
      <div class="feat-title">Unauthorized Attempt Alerts</div>
      <div class="feat-desc">Any unrecognized QR scan triggers an instant alert to the admin. Attempted pickups by revoked codes are flagged and logged automatically.</div>
    </div>
    <div class="feat-card reveal reveal-delay-2">
      <div class="feat-icon" style="background:#F0E8FF;"><i data-lucide="users-round" class="landing-icon" style="color:#6D5BD0;"></i></div>
      <div class="feat-title">Guardian Management</div>
      <div class="feat-desc">Parents assign up to 2 guardians per student. Guardians receive their own unique QR and can only access their assigned students.</div>
    </div>
  </div>
</section>

<!-- ROLES -->
<section class="roles">
  <div class="roles-header">
    <div class="section-tag">Who It's For</div>
    <h2 class="section-title">Five roles. One secure system.</h2>
  </div>
  <div class="roles-grid">
    <div class="role-card-v2 reveal">
      <div class="role-avatar" style="background:#EEF2FF;"><i data-lucide="shield-check" class="landing-icon" style="color:#4338CA;"></i></div>
      <div class="role-name-v2">Super Admin</div>
      <div class="role-tagline">Manages all schools, billing, subscriptions, and system-wide activity</div>
      <span class="role-pill" style="background:#EEF2FF; color:#4338CA;">Pickup Zone</span>
    </div>
    <div class="role-card-v2 reveal reveal-delay-1">
      <div class="role-avatar" style="background:#EFF6FF;"><i data-lucide="building-2" class="landing-icon" style="color:#1D4ED8;"></i></div>
      <div class="role-name-v2">School Admin</div>
      <div class="role-tagline">Approves pickups, manages students, monitors guards, exports logs</div>
      <span class="role-pill" style="background:#EFF6FF; color:#1D4ED8;">Per school</span>
    </div>
    <div class="role-card-v2 reveal reveal-delay-2">
      <div class="role-avatar" style="background:#ECFDF5;"><i data-lucide="users-round" class="landing-icon" style="color:#065F46;"></i></div>
      <div class="role-name-v2">Parent</div>
      <div class="role-tagline">Registers students, assigns guardians, receives & downloads QR codes</div>
      <span class="role-pill" style="background:#ECFDF5; color:#065F46;">Self-serve</span>
    </div>
    <div class="role-card-v2 reveal reveal-delay-3">
      <div class="role-avatar" style="background:#F0FDF4;"><i data-lucide="user-round" class="landing-icon" style="color:#166534;"></i></div>
      <div class="role-name-v2">Guardian</div>
      <div class="role-tagline">Receives assigned access and unique QR to pick up designated students</div>
      <span class="role-pill" style="background:#F0FDF4; color:#166534;">Invited</span>
    </div>
    <div class="role-card-v2 reveal reveal-delay-4">
      <div class="role-avatar" style="background:#FFFBEB;"><i data-lucide="scan-search" class="landing-icon" style="color:#92400E;"></i></div>
      <div class="role-name-v2">Security Guard</div>
      <div class="role-tagline">Scans QR codes via a secured, IP-restricted device at the gate</div>
      <span class="role-pill" style="background:#FFFBEB; color:#92400E;">On-site</span>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="pricing">
  <div class="pricing-header">
    <div class="section-tag" style="color:var(--teal-light); justify-content:center;">Pricing</div>
    <h2 class="section-title light">Simple, school-sized pricing</h2>
    <p class="section-sub light" style="margin: 0 auto;">No hidden fees. Cancel anytime. All plans include onboarding support.</p>
  </div>
  <div class="pricing-grid">
    <div class="plan-card reveal">
      <div class="plan-name">Basic</div>
      <div class="plan-desc">Perfect for small schools getting started with secure dismissal</div>
      <div class="plan-price">
        <div class="plan-price-num">$99</div>
        <div class="plan-price-per">per school / month</div>
      </div>
      <hr class="plan-divider"/>
      <div class="plan-features">
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Up to 200 students</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>2 security guard accounts</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Core QR verification</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Activity log & history</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Email notifications</div>
      </div>
      <a href="/signup" class="plan-cta">Get Started</a>
    </div>

    <div class="plan-card popular reveal reveal-delay-1">
      <div class="plan-badge">Most Popular</div>
      <div class="plan-name">Standard</div>
      <div class="plan-desc">For growing schools that need analytics and advanced reporting</div>
      <div class="plan-price">
        <div class="plan-price-num">$199</div>
        <div class="plan-price-per">per school / month</div>
      </div>
      <hr class="plan-divider"/>
      <div class="plan-features">
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Up to 500 students</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>5 security guard accounts</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Everything in Basic</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Analytics & reports</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>CSV/PDF export</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Dismissal scheduling</div>
      </div>
      <a href="/signup" class="plan-cta">Get Started</a>
    </div>

    <div class="plan-card reveal reveal-delay-2">
      <div class="plan-name">Premium</div>
      <div class="plan-desc">For large schools, districts, and institutions needing full control</div>
      <div class="plan-price">
        <div class="plan-price-num">$399</div>
        <div class="plan-price-per">per school / month</div>
      </div>
      <hr class="plan-divider"/>
      <div class="plan-features">
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Unlimited students</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Unlimited guards</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Everything in Standard</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>API access</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Multi-branch support</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Priority support & SLA</div>
        <div class="plan-feature"><span class="plan-check"><i data-lucide="check" class="landing-icon"></i></span>Custom integrations</div>
      </div>
      <a href="/contact" class="plan-cta">Contact Sales</a>
    </div>
  </div>
</section>

<!-- SECURITY TRUST -->
<section class="security">
  <div class="security-inner">
    <div class="reveal">
      <div class="section-tag">Security & Compliance</div>
      <h2 class="section-title">Enterprise-grade security for the people who matter most.</h2>
      <div class="security-list">
        <div class="security-item">
          <div class="security-icon-box" style="background:#E1F5EE;"><i data-lucide="lock-keyhole" class="landing-icon" style="color:var(--teal);"></i></div>
          <div>
            <div class="security-item-title">End-to-end encryption</div>
            <div class="security-item-desc">QR tokens are encrypted at generation and verified at scan. Data is encrypted at rest and in transit.</div>
          </div>
        </div>
        <div class="security-item">
          <div class="security-icon-box" style="background:#EFF6FF;"><i data-lucide="monitor-check" class="landing-icon" style="color:var(--blue);"></i></div>
          <div>
            <div class="security-item-title">Device & IP restricted scanning</div>
            <div class="security-item-desc">Guard scanning devices are registered and IP-locked. No unauthorized device can access the scan interface.</div>
          </div>
        </div>
        <div class="security-item">
          <div class="security-icon-box" style="background:#ECFDF5;"><i data-lucide="key-round" class="landing-icon" style="color:var(--teal);"></i></div>
          <div>
            <div class="security-item-title">Role-based access control</div>
            <div class="security-item-desc">Every user only sees and controls what their role permits. Admins can't access other schools. Guards can't modify records.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="security-cert-grid reveal reveal-delay-2">
      <div class="cert-card">
        <div class="cert-icon"><i data-lucide="lock-keyhole" class="landing-icon" style="color:var(--teal);"></i></div>
        <div class="cert-title">HTTPS Everywhere</div>
        <div class="cert-desc">All connections use TLS 1.3. No unencrypted data ever leaves the server.</div>
      </div>
      <div class="cert-card">
        <div class="cert-icon"><i data-lucide="baby" class="landing-icon" style="color:var(--blue);"></i></div>
        <div class="cert-title">COPPA Compliant</div>
        <div class="cert-desc">Fully compliant with the Children's Online Privacy Protection Act.</div>
      </div>
      <div class="cert-card">
        <div class="cert-icon"><i data-lucide="globe-2" class="landing-icon" style="color:var(--teal);"></i></div>
        <div class="cert-title">GDPR Ready</div>
        <div class="cert-desc">Data handling built for US and EU regulatory requirements.</div>
      </div>
      <div class="cert-card">
        <div class="cert-icon"><i data-lucide="database" class="landing-icon" style="color:var(--blue);"></i></div>
        <div class="cert-title">Multi-Tenant Isolation</div>
        <div class="cert-desc">Each school's data is fully isolated. Zero cross-tenant data access.</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA STRIP -->
<div class="cta-strip">
  <h2 class="cta-title">Ready to secure your dismissal process?</h2>
  <p class="cta-sub">Set up in under a day. No hardware required. Schools are live in hours, not weeks.</p>
  <a href="/signup" class="btn-cta-white">
    Start Free Trial
    <i data-lucide="arrow-right" class="landing-icon"></i>
  </a>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-top">
    <div>
      <a href="/" class="nav-logo" style="margin-bottom:0;">
        <div class="nav-logo-icon">
          <i data-lucide="shield-check" class="landing-icon shield-svg" style="color:var(--white);"></i>
        </div>
        <span class="nav-logo-text">Pickup Zone</span>
      </a>
      <p class="footer-brand-desc">Secure, QR-based student dismissal for modern schools. Built to protect what matters most.</p>
    </div>
    <div>
      <div class="footer-col-title">Product</div>
      <div class="footer-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#how-it-works">How It Works</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
    <div>
      <div class="footer-col-title">Company</div>
      <div class="footer-links">
        <a href="/about">About</a>
        <a href="/blogs">Blogs</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
    <div>
      <div class="footer-col-title">Legal</div>
      <div class="footer-links">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/cancellation-policy">Cancellation Policy</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2026 Pickup Zone. All rights reserved.</div>
    <div class="footer-socials" aria-label="Social links">
      <a href="https://www.facebook.com" class="footer-social" aria-label="Facebook" target="_blank" rel="noreferrer">
        <i data-lucide="facebook" class="landing-icon"></i>
      </a>
      <a href="https://www.instagram.com" class="footer-social" aria-label="Instagram" target="_blank" rel="noreferrer">
        <i data-lucide="instagram" class="landing-icon"></i>
      </a>
      <a href="https://www.linkedin.com" class="footer-social" aria-label="LinkedIn" target="_blank" rel="noreferrer">
        <i data-lucide="linkedin" class="landing-icon"></i>
      </a>
      <a href="https://www.twitter.com" class="footer-social" aria-label="Twitter" target="_blank" rel="noreferrer">
        <i data-lucide="twitter" class="landing-icon"></i>
      </a>
    </div>
  </div>
</footer>

<script src="https://unpkg.com/lucide@0.475.0/dist/umd/lucide.min.js"></script>
<script>
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));

  // Animated counters
  function animateCounter(el, target, suffix='', decimals=0) {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = start + (target - start) * ease;
      el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = decimals > 0 ? target.toFixed(decimals) : target;
    }
    requestAnimationFrame(update);
  }

  const statNums = document.querySelectorAll('.stat-num span');
  let statsAnimated = false;
  const statsSection = document.querySelector('.stats-bar');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        const targets = [200, 1.2, 99.9, 0];
        const decimals = [0, 1, 1, 0];
        statNums.forEach((el, i) => animateCounter(el, targets[i], '', decimals[i]));
      }
    });
  }, { threshold: 0.5 });
  if (statsSection) statsObserver.observe(statsSection);

  // Smooth nav background on scroll
  const nav = document.querySelector('nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(7,29,59,0.98)';
    } else {
      nav.style.background = 'rgba(7,29,59,0.92)';
    }
  });
</script>

</body>
</html>`

export default function LandingPage() {
  useEffect(() => {
    document.open()
    document.write(HOME_PAGE_HTML)
    document.close()
  }, [])

  return null
}
