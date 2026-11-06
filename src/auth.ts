import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyPassword } from "@/lib/auth/password";
import { ensureUser } from "@/lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
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
    async signIn({ user }) {
      if (!user.email) return false;
      await ensureUser(user.email);
      return true;
    },
  },
});
