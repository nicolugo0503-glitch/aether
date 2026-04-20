import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAyrshareProfile, getConnectUrl } from "@/lib/social";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let profileKey = user.ayrshareProfileKey;

  if (!profileKey) {
    profileKey = await createAyrshareProfile(user.id, user.email);
    await prisma.user.update({
      where: { id: user.id },
      data: { ayrshareProfileKey: profileKey },
    });
  }

  const url = await getConnectUrl(profileKey);
  return NextResponse.json({ url });
}
