import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ime, priimek, email, password, passwordConfirm } = body;

    // Validacija
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Geslo mora biti dolgo vsaj 8 znakov" },
        { status: 400 }
      );
    }

    // Ustvari uporabnika v Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: ime,
          last_name: priimek,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Napaka pri registraciji" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Registracija uspešna. Preverite e-pošto za potrditev.",
        user: data.user,
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
