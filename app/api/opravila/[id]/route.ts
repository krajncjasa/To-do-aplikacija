import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_PONAVLJANJE = [
  "samo_enkrat",
  "vsak_dan",
  "vsak_teden",
  "vsak_mesec",
  "vsako_leto",
] as const;

const resolveTaskId = async (paramsPromise: RouteContext["params"]) => {
  const { id } = await paramsPromise;

  if (!id || !/^\d+$/.test(id)) {
    return null;
  }

  return id;
};

const toDatePart = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const cloneDateTimeToClickedDate = (sourceDateTime: string, clickedDate: Date) => {
  const source = new Date(sourceDateTime);

  if (Number.isNaN(source.getTime())) {
    return null;
  }

  const hours = String(source.getHours()).padStart(2, "0");
  const minutes = String(source.getMinutes()).padStart(2, "0");
  const seconds = String(source.getSeconds()).padStart(2, "0");

  return `${toDatePart(clickedDate)}T${hours}:${minutes}:${seconds}`;
};

const parseDateOnly = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const taskId = await resolveTaskId(params);

    if (!taskId) {
      return NextResponse.json(
        { error: "Neveljaven ID opravila" },
        { status: 400 }
      );
    }

    const { data: opravilo, error } = await supabaseAdmin
      .from("opravila")
      .select("id, naslov, opis, od, do, kolikokrat, opravljeno, created_at, uporabnik_id")
      .eq("id", taskId)
      .single();

    if (error || !opravilo) {
      return NextResponse.json(
        { error: "Opravilo ne obstaja" },
        { status: 404 }
      );
    }

    if (opravilo.uporabnik_id !== sessionUser.id) {
      return NextResponse.json(
        { error: "Nimas dostopa do tega opravila" },
        { status: 403 }
      );
    }

    return NextResponse.json({ opravilo }, { status: 200 });
  } catch (err) {
    console.error("GET /api/opravila/[id] error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const taskId = await resolveTaskId(params);

    if (!taskId) {
      return NextResponse.json(
        { error: "Neveljaven ID opravila" },
        { status: 400 }
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

    if (doDate.getTime() <= odDate.getTime()) {
      return NextResponse.json(
        { error: "Do kdaj mora biti po Od kdaj" },
        { status: 400 }
      );
    }

    const { data: opravilo, error: fetchError } = await supabaseAdmin
      .from("opravila")
      .select("id, uporabnik_id")
      .eq("id", taskId)
      .single();

    if (fetchError || !opravilo) {
      return NextResponse.json(
        { error: "Opravilo ne obstaja" },
        { status: 404 }
      );
    }

    if (opravilo.uporabnik_id !== sessionUser.id) {
      return NextResponse.json(
        { error: "Nimas dostopa do tega opravila" },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("opravila")
      .update({
        naslov,
        opis: opis || null,
        od: odKdaj,
        do: doKdaj,
        kolikokrat: ponavljanje,
      })
      .eq("id", taskId)
      .select("id, naslov, opis, od, do, kolikokrat, opravljeno, created_at")
      .single();

    if (updateError) {
      console.error("Update task details error:", updateError);
      return NextResponse.json(
        { error: "Napaka pri posodabljanju opravila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ opravilo: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/opravila/[id] error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const taskId = await resolveTaskId(params);

    if (!taskId) {
      return NextResponse.json(
        { error: "Neveljaven ID opravila" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { opravljeno } = body;
    const datumKljuka = typeof body.datumKljuka === "string" ? body.datumKljuka : "";
    const clickedDate = parseDateOnly(datumKljuka);

    if (typeof opravljeno !== "boolean") {
      return NextResponse.json(
        { error: "Polje opravljeno mora biti boolean" },
        { status: 400 }
      );
    }

    // Preveri, da je opravilo lastnika uporabnika
    const { data: opravilo, error: fetchError } = await supabaseAdmin
      .from("opravila")
      .select("id, uporabnik_id, naslov, opis, od, do, kolikokrat, vrsta, opravljeno")
      .eq("id", taskId)
      .single();

    if (fetchError || !opravilo) {
      return NextResponse.json(
        { error: "Opravilo ne obstaja" },
        { status: 404 }
      );
    }

    if (opravilo.uporabnik_id !== sessionUser.id) {
      return NextResponse.json(
        { error: "Nimas dostopa do tega opravila" },
        { status: 403 }
      );
    }

    // Ko uporabnik označi opravilo kot opravljeno, se ustvari kopija z opravljeno=true,
    // glavno opravilo pa ostane nespremenjeno (opravljeno ostane null).
    if (opravljeno) {
      if (!clickedDate) {
        return NextResponse.json(
          { error: "Neveljaven datum klika" },
          { status: 400 }
        );
      }

      const klonOd = cloneDateTimeToClickedDate(opravilo.od, clickedDate);
      const klonDo = cloneDateTimeToClickedDate(opravilo.do, clickedDate);

      if (!klonOd || !klonDo) {
        return NextResponse.json(
          { error: "Napaka pri pripravi datuma kloniranega opravila" },
          { status: 400 }
        );
      }

      const { data: created, error: createError } = await supabaseAdmin
        .from("opravila")
        .insert({
          naslov: opravilo.naslov,
          opis: opravilo.opis,
          od: klonOd,
          do: klonDo,
          uporabnik_id: sessionUser.id,
          kolikokrat: "samo_enkrat",
          vrsta: "klon",
          opravljeno: true,
        })
        .select("id, naslov, opis, od, do, kolikokrat, vrsta, opravljeno, created_at")
        .single();

      if (createError) {
        console.error("Create completed task copy error:", createError);
        return NextResponse.json(
          { error: "Napaka pri ustvarjanju kopije opravila" },
          { status: 500 }
        );
      }

      return NextResponse.json({ opravilo: created }, { status: 201 });
    }

    return NextResponse.json({ opravilo }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/opravila/[id] error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const taskId = await resolveTaskId(params);

    if (!taskId) {
      return NextResponse.json(
        { error: "Neveljaven ID opravila" },
        { status: 400 }
      );
    }

    // Preveri, da je opravilo lastnika uporabnika
    const { data: opravilo, error: fetchError } = await supabaseAdmin
      .from("opravila")
      .select("id, uporabnik_id")
      .eq("id", taskId)
      .single();

    if (fetchError || !opravilo) {
      return NextResponse.json(
        { error: "Opravilo ne obstaja" },
        { status: 404 }
      );
    }

    if (opravilo.uporabnik_id !== sessionUser.id) {
      return NextResponse.json(
        { error: "Nimas dostopa do tega opravila" },
        { status: 403 }
      );
    }

    // Izbris opravila
    const { error: deleteError } = await supabaseAdmin
      .from("opravila")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      console.error("Delete task error:", deleteError);
      return NextResponse.json(
        { error: "Napaka pri brisanju opravila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/opravila/[id] error:", err);
    return NextResponse.json(
      { error: "Notranja napaka streznika" },
      { status: 500 }
    );
  }
}
