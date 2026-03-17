import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/session";
import ProfilPageClient from "./ProfilPageClient";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("todo_session")?.value;
  const sessionUser = verifySessionToken(token);

  if (!sessionUser) {
    redirect("/prijava");
  }

  return <ProfilPageClient sessionUser={sessionUser} />;
}
