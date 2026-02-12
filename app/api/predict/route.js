import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getOrSetUserId } from "@/lib/userCookie";
import { predictRa, predictRz } from "@/lib/model";

export async function POST(req) {
  try {
    const userId = await getOrSetUserId();
    const body = await req.json();

    const vc = Number(body.vc);
    const ap = Number(body.ap);
    const fn = Number(body.fn);
    const addNoise = Boolean(body.add_noise);

    if (![vc, ap, fn].every(Number.isFinite)) {
      return NextResponse.json({ error: "vc/ap/fn must be numbers" }, { status: 400 });
    }

    const ra = Number(predictRa(vc, ap, fn, addNoise));
    const rz = Number(predictRz(vc, ap, fn, addNoise));

    const supa = supabaseServer();
    const { data, error } = await supa
      .from("measurements")
      .insert({
        user_id: userId,
        vc, ap, fn,
        add_noise: addNoise,
        ra, rz,
      })
      .select("timestamp, vc, ap, fn, add_noise, ra, rz")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
