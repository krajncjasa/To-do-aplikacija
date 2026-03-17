import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSessionToken, sessionMaxAge } from "@/lib/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Strezniski Supabase kljuc ni nastavljen" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta in geslo sta obvezna" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "E-postni naslov ni veljaven" },
        { status: 400 }
      );
    }

    const { data: userRecord, error } = await supabaseAdmin
      .from("uporabniki")
      .select("id, ime, priimek, eposta, geslo")
      .eq("eposta", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Napaka pri prijavi" },
        { status: 500 }
      );
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: "Napačen e-postni naslov ali geslo" },
        { status: 401 }
      );
    }

    const isValidPassword = await compare(password, userRecord.geslo as string);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Napačen e-postni naslov ali geslo" },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      id: userRecord.id as number,
      ime: userRecord.ime as string,
      priimek: userRecord.priimek as string,
      eposta: userRecord.eposta as string,
    });

    const response = NextResponse.json(
      {
        message: "Prijava uspesna",
        redirectTo: "/aplikacija",
        user: {
          id: userRecord.id,
          ime: userRecord.ime,
          priimek: userRecord.priimek,
          eposta: userRecord.eposta,
        },
      },
      { status: 200 }
    );

    response.cookies.set("todo_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionMaxAge,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}
