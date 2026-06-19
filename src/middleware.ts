// ============================================================
// Middleware - protegge tutte le route dell'app eccetto
// /login e gli endpoint di autenticazione.
// ============================================================
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    "/stats/:path*",
    "/settings/:path*",
    "/api/days/:path*",
    "/api/sports/:path*",
    "/api/settings/:path*",
    "/api/stats/:path*",
    "/api/export/:path*",
    "/api/import/:path*",
  ],
};
