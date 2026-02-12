import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function getOrSetUserId() {
  const jar = await cookies();
  let userId = jar.get("vp_user")?.value;

  if (!userId) {
    userId = uuidv4();
    jar.set("vp_user", userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return userId;
}

