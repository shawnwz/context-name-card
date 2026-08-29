// A branded HTML email for the passwordless sign-in link, built to match
// the app's own look (the logo mark and violet accent from LandingHero /
// LogoMark) rather than Auth.js's generic blue default template.
//
// Deliberately table-based with every rule inlined — the safe subset that
// renders consistently across Gmail, Apple Mail, and Outlook, none of
// which reliably support <style> blocks or modern CSS layout in email.
export function buildSignInEmailHtml(confirmUrl: string, host: string): string {
  return `
<body style="margin:0;padding:32px 16px;background:#f4f2fb;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="480" border="0" cellspacing="0" cellpadding="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #ece9f7;border-radius:16px;">
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <svg width="44" height="44" viewBox="0 0 56 56" fill="none" style="display:block;margin:0 auto 12px;">
                <rect x="4" y="4" width="34" height="34" rx="10" stroke="#c4b5fd" stroke-width="2" />
                <rect x="18" y="18" width="34" height="34" rx="10" fill="#7c3aed" />
              </svg>
              <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#171717;">
                ContextID
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <div style="font-size:20px;font-weight:600;color:#171717;padding-bottom:8px;">
                Sign in to your account
              </div>
              <div style="font-size:14px;line-height:20px;color:#6b7280;">
                Click the button below to continue signing in to ContextID on <strong style="color:#374151;">${host}</strong>.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px;">
              <a href="${confirmUrl}" target="_blank"
                style="display:inline-block;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;background:#7c3aed;border-radius:8px;padding:12px 32px;">
                Sign in
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 8px;">
              <div style="font-size:13px;line-height:19px;color:#9ca3af;">
                You'll see one more confirmation step before you're signed in.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 32px;">
              <div style="height:1px;background:#ece9f7;margin-bottom:16px;"></div>
              <div style="font-size:12px;line-height:18px;color:#9ca3af;">
                If you did not request this email, you can safely ignore it.
              </div>
            </td>
          </tr>
        </table>
        <div style="max-width:480px;padding:20px 12px 0;font-size:12px;color:#b3aed6;">
          Or paste this link into your browser: <a href="${confirmUrl}" style="color:#9c8fd6;">${confirmUrl}</a>
        </div>
      </td>
    </tr>
  </table>
</body>
`;
}
