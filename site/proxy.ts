import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk runs only where accounts are used, so library pages stay static and cached.
// Without Clerk keys (local preview before setup) everything passes through.
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: ["/account/:path*", "/collections/:path*", "/sign-in/:path*", "/api/:path*"],
};
