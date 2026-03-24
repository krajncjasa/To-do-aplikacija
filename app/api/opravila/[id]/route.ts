import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const resolveTaskId = async (paramsPromise: RouteContext["params"]) => {
  const { id } = await paramsPromise;

  if (!id || !/^\d+$/.test(id)) {
    return null;
  }

  return id;
};

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

    if (typeof opravljeno !== "boolean") {
      return NextResponse.json(
        { error: "Polje opravljeno mora biti boolean" },
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

    // Posodobi opravljeno polje
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("opravila")
      .update({ opravljeno })
      .eq("id", taskId)
      .select()
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
