const { buildClientUrl } = require('../config/appUrls');

const theme = {
  navy: '#071D3B',
  navyMid: '#0B2E5A',
  blue: '#1B6ECC',
  teal: '#1A9E75',
  tealPale: '#E1F5EE',
  amber: '#EF9F27',
  amberPale: '#FEF3DC',
  red: '#E24B4A',
  redPale: '#FDEAEA',
  surface: '#F4F6FA',
  border: '#E2E6EE',
  text: '#0A1628',
  textMuted: '#4A5568',
  textSoft: '#8A96A8',
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const accentForTone = (tone = 'teal') => {
  if (tone === 'blue') return theme.blue;
  if (tone === 'amber') return theme.amber;
  if (tone === 'red') return theme.red;
  return theme.teal;
};

const paleForTone = (tone = 'teal') => {
  if (tone === 'amber') return theme.amberPale;
  if (tone === 'red') return theme.redPale;
  return theme.tealPale;
};

const renderParagraphs = (paragraphs = []) => paragraphs
  .filter((paragraph) => paragraph !== undefined && paragraph !== null && paragraph !== '')
  .map((paragraph) => `
    <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: ${theme.textMuted};">
      ${escapeHtml(paragraph)}
    </p>
  `)
  .join('');

const renderRows = (rows = []) => {
  if (!rows.length) return '';

  return `
    <table role="presentation" style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid ${theme.border}; border-radius: 10px; overflow: hidden;">
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td style="padding: 12px 14px; border-bottom: 1px solid ${theme.border}; color: ${theme.textSoft}; font-size: 13px; background: #ffffff;">
              ${escapeHtml(row.label)}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid ${theme.border}; color: ${theme.text}; font-size: 14px; font-weight: 700; text-align: right; background: #ffffff;">
              ${escapeHtml(row.value)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const buildEmailTemplate = ({
  title,
  subtitle = 'PickupZone',
  greeting = 'Hello,',
  paragraphs = [],
  rows = [],
  actionUrl,
  actionLabel,
  notice,
  tone = 'teal',
}) => {
  const accent = accentForTone(tone);
  const pale = paleForTone(tone);
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeGreeting = escapeHtml(greeting);
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : '';
  const safeActionLabel = actionLabel ? escapeHtml(actionLabel) : '';

  return `
    <!doctype html>
    <html>
      <body style="margin: 0; padding: 0; background: ${theme.surface}; font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif; color: ${theme.text};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          ${safeTitle}
        </div>
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: ${theme.surface}; padding: 24px 0;">
          <tr>
            <td align="center" style="padding: 24px 12px;">
              <table role="presentation" style="width: 100%; max-width: 620px; border-collapse: collapse; background: #ffffff; border: 1px solid ${theme.border}; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(7,29,59,0.08);">
                <tr>
                  <td style="background: ${theme.navy}; padding: 26px 28px;">
                    <div style="display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.12); color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0; text-transform: uppercase;">
                      PickupZone
                    </div>
                    <h1 style="margin: 14px 0 6px; color: #ffffff; font-size: 26px; line-height: 1.18; font-weight: 800;">
                      ${safeTitle}
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.76); font-size: 14px; line-height: 1.5;">
                      ${safeSubtitle}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height: 4px; background: ${accent}; line-height: 4px; font-size: 4px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding: 30px 28px 26px;">
                    <p style="margin: 0 0 16px; color: ${theme.text}; font-size: 16px; font-weight: 700;">
                      ${safeGreeting}
                    </p>
                    ${renderParagraphs(paragraphs)}
                    ${renderRows(rows)}
                    ${notice ? `
                      <div style="margin: 20px 0; padding: 14px 16px; border-radius: 10px; background: ${pale}; border: 1px solid ${accent}; color: ${theme.textMuted}; font-size: 14px; line-height: 1.55;">
                        ${escapeHtml(notice)}
                      </div>
                    ` : ''}
                    ${safeActionUrl && safeActionLabel ? `
                      <div style="margin: 24px 0 8px; text-align: center;">
                        <a href="${safeActionUrl}" style="display: inline-block; background: ${accent}; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 800;">
                          ${safeActionLabel}
                        </a>
                      </div>
                    ` : ''}
                    <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6; color: ${theme.textSoft};">
                      PickupZone Team
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 24px; background: #FAFBFD; border-top: 1px solid ${theme.border}; text-align: center; color: ${theme.textSoft}; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} PickupZone. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

module.exports = {
  buildClientUrl,
  buildEmailTemplate,
  escapeHtml,
};
