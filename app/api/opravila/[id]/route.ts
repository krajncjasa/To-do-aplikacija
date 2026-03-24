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

const normalizeDateKeys = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
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
      .select("id, naslov, opis, od, do, kolikokrat, opravljeno, opravljeno_datumi, created_at, uporabnik_id")
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
      .select("id, naslov, opis, od, do, kolikokrat, opravljeno, opravljeno_datumi, created_at")
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
    const { opravljeno, occurrenceDate } = body;

    if (typeof opravljeno !== "boolean") {
      return NextResponse.json(
        { error: "Polje opravljeno mora biti boolean" },
        { status: 400 }
      );
    }

    // Preveri, da je opravilo lastnika uporabnika
    const { data: opravilo, error: fetchError } = await supabaseAdmin
      .from("opravila")
      .select("id, uporabnik_id, kolikokrat, opravljeno_datumi")
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

    const isRecurring = opravilo.kolikokrat !== "samo_enkrat";

    let updatePayload: {
      opravljeno?: boolean;
      opravljeno_datumi?: string[];
    } = { opravljeno };

    if (isRecurring) {
      if (typeof occurrenceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
        return NextResponse.json(
          { error: "Pri ponavljajočem opravilu manjka veljaven datum pojavnosti" },
          { status: 400 }
        );
      }

      const currentDates = normalizeDateKeys(opravilo.opravljeno_datumi);
      const nextDates = new Set(currentDates);

      if (opravljeno) {
        nextDates.add(occurrenceDate);
      } else {
        nextDates.delete(occurrenceDate);
      }

      updatePayload = {
        opravljeno_datumi: Array.from(nextDates).sort(),
      };
    }

    // Posodobi opravljeno stanje
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("opravila")
      .update(updatePayload)
      .eq("id", taskId)
      .select("id, naslov, opis, od, do, kolikokrat, opravljeno, opravljeno_datumi, created_at")
      .single();

    if (updateError) {
      console.error("Update task error:", updateError);
      return NextResponse.json(
        { error: "Napaka pri posodabljanju opravila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ opravilo: updated }, { status: 200 });
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
