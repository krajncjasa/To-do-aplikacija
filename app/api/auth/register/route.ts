import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

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
    const ime = typeof body.ime === "string" ? body.ime.trim() : "";
    const priimek = typeof body.priimek === "string" ? body.priimek.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm =
      typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";

    if (!ime || !priimek || !email || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: "Vsa polja so obvezna" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Gesli se ne ujemata" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "E-postni naslov ni veljaven" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Geslo mora biti dolgo vsaj 8 znakov" },
        { status: 400 }
      );
    }

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("uporabniki")
      .select("id")
      .eq("eposta", email)
      .maybeSingle();

    if (existingUserError) {
      return NextResponse.json(
        { error: "Napaka pri preverjanju e-poste" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Uporabnik s tem e-postnim naslovom ze obstaja" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const { data, error } = await supabaseAdmin
      .from("uporabniki")
      .insert({
        ime,
        priimek,
        eposta: email,
        geslo: hashedPassword,
      })
      .select("id, ime, priimek, eposta")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Uporabnik s tem e-postnim naslovom ze obstaja" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Napaka pri shranjevanju uporabnika" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Registracija uspesna",
        user: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Notranja napaka strežnika" },
      { status: 500 }
    );
  }
}
