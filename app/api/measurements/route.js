import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getOrSetUserId } from "@/lib/userCookie";

export async function GET() {
  try {
    const userId = await getOrSetUserId();
    const supa = supabaseServer();

    const { data, error } = await supa
      .from("measurements")
      .select("timestamp, vc, ap, fn, add_noise, ra, rz")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getOrSetUserId();
    const supa = supabaseServer();

    const { error } = await supa
      .from("measurements")
      .delete()
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "cleared" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
