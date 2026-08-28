// Mirrored in apps/api/src/routes/identities.ts and
// apps/api/src/routes/identityContexts.ts — keep both in sync.

// Fits roughly 3 lines on the name-card templates (all of which are a fixed
// width around 320-340px of text-sm content) without overflowing the card.
export const DESCRIPTION_MAX_LENGTH = 200;

// Generous for legal/display names in any script, short enough that the
// (at most 2-line-clamped) name heading can't blow out a card's height.
export const NAME_MAX_LENGTH = 100;

export const LOCATION_MAX_LENGTH = 100;

// RFC 5321's mailbox length limit.
export const EMAIL_MAX_LENGTH = 254;

// Comfortably covers a full international number with an extension.
export const TEL_MAX_LENGTH = 30;

// Short by design — shown as a compact label (e.g. "Professional",
// "Freelance"), and part of a unique index (userId, name) in Postgres,
// which errors on overly large values.
export const CONTEXT_NAME_MAX_LENGTH = 50;
