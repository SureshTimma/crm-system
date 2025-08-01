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
  console.log("Request path:", req.nextUrl.pathname);

  // Allow public routes
  if (
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/favicon") ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    console.log("No session cookie found, redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verify session cookie and get user data
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
    console.log("Session verified for user:", decodedToken.uid);
    
    // Add user info to request headers for use in components
    const response = NextResponse.next();
    response.headers.set('x-user-id', decodedToken.uid);
    response.headers.set('x-user-email', decodedToken.email || '');
    response.headers.set('x-user-name', decodedToken.name || decodedToken.display_name || '');
    
    return response;
  } catch (e) {
    console.error("Session verification failed:", e);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("session", "", { expires: new Date(0) });
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|$).*)",
  ],
};
