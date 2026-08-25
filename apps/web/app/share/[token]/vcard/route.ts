import { NextResponse } from "next/server";
import { buildVCard, type VCardIdentity } from "../../../../lib/build-vcard";
import { getSharedIdentity } from "../../../../lib/get-shared-identity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const identity = await getSharedIdentity<VCardIdentity>(token);

  if (!identity) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const filename = identity.displayName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "contact";

  return new NextResponse(buildVCard(identity), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.vcf"`,
    },
  });
}
