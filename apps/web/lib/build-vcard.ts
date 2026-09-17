export type VCardIdentity = {
  courtesyTitle: string | null;
  givenName: string;
  familyName: string | null;
  displayName: string;
  email: string | null;
  tel: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
};

// RFC 6350 §3.4 text escaping.
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildVCard(identity: VCardIdentity): string {
  const fullName = identity.courtesyTitle
    ? `${identity.courtesyTitle} ${identity.displayName}`
    : identity.displayName;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeText(identity.familyName ?? "")};${escapeText(identity.givenName)};;;`,
    `FN:${escapeText(fullName)}`,
  ];

  if (identity.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(identity.email)}`);
  if (identity.tel) lines.push(`TEL;TYPE=CELL:${escapeText(identity.tel)}`);
  if (identity.location) lines.push(`ADR;TYPE=WORK:;;${escapeText(identity.location)};;;;`);
  if (identity.description) lines.push(`NOTE:${escapeText(identity.description)}`);
  if (identity.image?.startsWith("http")) lines.push(`PHOTO;VALUE=uri:${identity.image}`);

  lines.push("END:VCARD");

  return lines.join("\r\n");
}
