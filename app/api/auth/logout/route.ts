import { NextRequest, NextResponse } from "next/server";

const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set("todo_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
};

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/prijava", request.url));
  clearSessionCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/prijava", request.url));
  clearSessionCookie(response);
  return response;
}
