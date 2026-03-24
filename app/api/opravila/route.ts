import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_PONAVLJANJE = [
  "samo_enkrat",
  "vsak_dan",
  "vsak_teden",
  "vsak_mesec",
  "vsako_leto",
] as const;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Strezniski Supabase kljuc ni nastavljen" },
        { status: 500 }
      );
    }

    const token = request.cookies.get("todo_session")?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Nisi prijavljen" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const naslov = typeof body.naslov === "string" ? body.naslov.trim() : "";
    const opis = typeof body.opis === "string" ? body.opis.trim() : "";
    const odKdaj = typeof body.odKdaj === "string" ? body.odKdaj : "";
    const doKdaj = typeof body.doKdaj === "string" ? body.doKdaj : "";
    const ponavljanje =
      typeof body.ponavljanje === "string" ? body.ponavljanje : "samo_enkrat";

    if (!naslov || !odKdaj || !doKdaj) {
      return NextResponse.json(
        { error: "Naslov, od kdaj in do kdaj so obvezni" },
        { status: 400 }
      );
    }

    if (!ALLOWED_PONAVLJANJE.includes(ponavljanje as (typeof ALLOWED_PONAVLJANJE)[number])) {
      return NextResponse.json(
        { error: "Neveljavna vrednost za ponavljanje" },
        { status: 400 }
      );
    }

    const odDate = new Date(odKdaj);
    const doDate = new Date(doKdaj);

    if (Number.isNaN(odDate.getTime()) || Number.isNaN(doDate.getTime())) {
      return NextResponse.json(
        { error: "Neveljaven datum" },
        { status: 400 }
      );
    }

    // Zaokroži "sedaj" na celo minuto (brez sekund/milisekund)
    const now = new Date();
    now.setSeconds(0, 0);
    const nowTime = now.getTime();

    if (odDate.getTime() < nowTime) {
      return NextResponse.json(
        { error: "Od kdaj ne sme biti v preteklosti" },
        { status: 400 }
      );
    }

    if (doDate.getTime() < nowTime) {
      return NextResponse.json(
        { error: "Do kdaj ne sme biti v preteklosti" },
        { status: 400 }
      );
    }

    if (doDate.getTime() <= odDate.getTime()) {
      return NextResponse.json(
        { error: "Do kdaj mora biti po Od kdaj" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("opravila")
      .insert({
        naslov,
        opis: opis || null,
        od: odKdaj,
        do: doKdaj,
        uporabnik_id: sessionUser.id,
        kolikokrat: ponavljanje,
        opravljeno_datumi: [],
      })
      .select("id, naslov, opis, od, do, uporabnik_id, kolikokrat, opravljeno, opravljeno_datumi")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Napaka pri shranjevanju opravila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Opravilo ustvarjeno", data }, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Strezniski Supabase kljuc ni nastavljen" },
        { status: 500 }
      );
    }

    const token = request.cookies.get("todo_session")?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Nisi prijavljen" },
        { status: 401 }
      );
    }

    const { data: opravila, error } = await supabaseAdmin
      .from("opravila")
      .select("id, naslov, opis, od, do, uporabnik_id, kolikokrat, opravljeno, opravljeno_datumi, created_at")
      .eq("uporabnik_id", sessionUser.id)
      .order("od", { ascending: true });

    if (error) {
      console.error("Fetch tasks error:", error);
      return NextResponse.json(
        { error: "Napaka pri pridobivanju opravil" },
        { status: 500 }
      );
    }

    return NextResponse.json({ opravila }, { status: 200 });
  } catch (err) {
    console.error("GET /api/opravila error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}
