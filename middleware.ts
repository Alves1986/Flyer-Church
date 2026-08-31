import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/extract",
  "/api/generate",
  "/api/openrouter-models",
  "/api/templates",
  "/api/flyers",
  "/api/assets",
  "/api/upload",
  "/api/brand-dna",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk/webhook",
]);

const isIgnoredRoute = createRouteMatcher([
  "/api/extract",
  "/api/generate",
  "/api/openrouter-models",
  "/api/templates",
  "/api/flyers",
  "/api/assets",
  "/api/upload",
  "/api/brand-dna",
  "/api/clerk/webhook",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, orgRole } = await auth();
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/clerk/")) {
    const requestHeaders = new Headers(req.headers);
    if (orgId) requestHeaders.set("x-organization-id", orgId);
    if (userId) requestHeaders.set("x-user-id", userId);
    if (orgRole) requestHeaders.set("x-org-role", orgRole);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!userId && !isPublicRoute(req) && pathname !== "/") {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (userId && !orgId && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/configuracao") || pathname.startsWith("/flyers/novo") || pathname.startsWith("/templates/novo") || pathname.startsWith("/biblioteca") || pathname.startsWith("/marca") || pathname.startsWith("/historico"))) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};