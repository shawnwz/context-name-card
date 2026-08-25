import { describe, expect, it } from "vitest";
import { BACKGROUND_PRESETS, getIdentityBackgroundSrc, isBackgroundPresetId } from "./background-presets";

describe("isBackgroundPresetId", () => {
  it("is true for a known preset id", () => {
    expect(isBackgroundPresetId("teal-horizon")).toBe(true);
  });

  it("is false for an unknown id", () => {
    expect(isBackgroundPresetId("not-a-preset")).toBe(false);
  });
});

describe("getIdentityBackgroundSrc", () => {
  it("returns the src of the identity's chosen preset", () => {
    const src = getIdentityBackgroundSrc({ id: "abc", background: "amber-dusk" });
    expect(src).toBe("/backgrounds/amber-dusk.webp");
  });

  it("falls back to a deterministic preset when background is unset", () => {
    const identity = { id: "identity-42", background: null };
    const first = getIdentityBackgroundSrc(identity);
    const second = getIdentityBackgroundSrc(identity);

    expect(BACKGROUND_PRESETS.some((preset) => preset.src === first)).toBe(true);
    expect(second).toBe(first);
  });
});
