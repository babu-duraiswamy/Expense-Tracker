import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe config (no providers — Credentials' authorize uses Node's
 * crypto, which isn't available in the Edge middleware runtime). Full
 * config with providers lives in `src/auth.ts`.
 */
export const authConfig: NextAuthConfig = {
  // Required for self-hosting outside Vercel (which infers the host itself);
  // safe for a single-user app with no open registration.
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) return true;
      return isLoggedIn;
    },
  },
};
