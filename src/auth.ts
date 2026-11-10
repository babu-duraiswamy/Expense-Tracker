import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { verifyPassword } from "@/lib/auth/password";
import { ensureUser } from "@/lib/users";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export function googleConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: SEVEN_DAYS },
  providers: [
    ...(googleConfigured() ? [Google] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const expectedEmail = process.env.AUTH_USER_EMAIL;
        const expectedHash = process.env.AUTH_PASSWORD_HASH;
        if (!expectedEmail || !expectedHash) return null;

        if (email.trim().toLowerCase() !== expectedEmail.toLowerCase()) return null;
        if (!verifyPassword(password, expectedHash)) return null;

        return { id: expectedEmail, email: expectedEmail };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.toLowerCase();
      const verified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
      return Boolean(email && verified && allowedEmails().includes(email));
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await ensureUser(user.email);
        token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
