import { describe, expect, it } from "vitest";
import { buildVCard } from "./build-vcard";

const base = {
  courtesyTitle: null,
  givenName: "Ada",
  familyName: "Lovelace",
  displayName: "Ada Lovelace",
  email: null,
  tel: null,
  location: null,
  description: null,
  image: null,
};

describe("buildVCard", () => {
  it("includes required N/FN fields and prepends the courtesy title to FN", () => {
    const vcard = buildVCard({ ...base, courtesyTitle: "Dr." });

    expect(vcard).toContain("N:Lovelace;Ada;;;");
    expect(vcard).toContain("FN:Dr. Ada Lovelace");
  });

  it("omits optional fields that are unset", () => {
    const vcard = buildVCard(base);

    expect(vcard).not.toContain("EMAIL");
    expect(vcard).not.toContain("TEL");
    expect(vcard).not.toContain("ADR");
    expect(vcard).not.toContain("NOTE");
    expect(vcard).not.toContain("PHOTO");
  });

  it("includes optional fields when set and escapes special characters", () => {
    const vcard = buildVCard({
      ...base,
      email: "ada@example.com",
      tel: "+1 555 0100",
      location: "London, UK",
      description: "Mathematician; programmer",
      image: "https://example.com/ada.jpg",
    });

    expect(vcard).toContain("EMAIL;TYPE=INTERNET:ada@example.com");
    expect(vcard).toContain("TEL;TYPE=CELL:+1 555 0100");
    expect(vcard).toContain("ADR;TYPE=WORK:;;London\\, UK;;;;");
    expect(vcard).toContain("NOTE:Mathematician\\; programmer");
    expect(vcard).toContain("PHOTO;VALUE=uri:https://example.com/ada.jpg");
  });

  it("skips PHOTO for a non-http image (e.g. a data URI placeholder)", () => {
    const vcard = buildVCard({ ...base, image: "data:image/svg+xml,..." });

    expect(vcard).not.toContain("PHOTO");
  });
});
