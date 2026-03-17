import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, createSessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("todo_session")?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Nisi prijaljen" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Strezniski Supabase kljuc ni nastavljen" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const ime = typeof body.ime === "string" ? body.ime.trim() : "";
    const priimek = typeof body.priimek === "string" ? body.priimek.trim() : "";
    const eposta = typeof body.eposta === "string" ? body.eposta.trim().toLowerCase() : "";

    if (!ime || !priimek || !eposta) {
      return NextResponse.json(
        { error: "Vsa polja so obvezna" },
        { status: 400 }
      );
    }

    if (ime.length < 2) {
      return NextResponse.json(
        { error: "Ime mora imeti vsaj 2 znaka" },
        { status: 400 }
      );
    }

    if (priimek.length < 2) {
      return NextResponse.json(
        { error: "Priimek mora imeti vsaj 2 znaka" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(eposta)) {
      return NextResponse.json(
        { error: "E-postni naslov ni veljaven" },
        { status: 400 }
      );
    }

    if (eposta !== sessionUser.eposta) {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("uporabniki")
        .select("id")
        .eq("eposta", eposta)
        .maybeSingle();

      if (checkError) {
        return NextResponse.json(
          { error: "Napaka pri preverjanju e-poste" },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { error: "Ta e-postni naslov je ze v uporabi" },
          { status: 409 }
        );
      }
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("uporabniki")
      .update({
        ime,
        priimek,
        eposta,
      })
      .eq("id", sessionUser.id)
      .select("id, ime, priimek, eposta")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Napaka pri posodabljanju profila" },
        { status: 500 }
      );
    }

    const newToken = createSessionToken({
      id: sessionUser.id,
      ime: updatedUser.ime as string,
      priimek: updatedUser.priimek as string,
      eposta: updatedUser.eposta as string,
    });

    const response = NextResponse.json(
      {
        message: "Profil je bil uspesno posodobljen",
        user: updatedUser,
      },
      { status: 200 }
    );

    response.cookies.set("todo_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}
