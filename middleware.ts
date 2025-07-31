import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";


if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "prodgain-crm-system",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;
  console.log("Session Cookie:", sessionCookie);

  // Allow public routes
  if (
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verify session cookie
    await getAuth().verifySessionCookie(sessionCookie);
    return NextResponse.next();
  } catch (e) {
    console.error("Session verification failed:", e);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("session", "", { expires: new Date(0) });
    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    // Add any other protected routes
  ],
};
