import prisma from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  secret: process.env.JWT_SECRET,
  providers: [
    CredentialsProvider({
      type: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };
        const user: any = await prisma.user.findFirst({
          where: {
            active: true,
            email: {
              equals: email,
              mode: "insensitive",
            },
            deleted_at: null,
          },
        });
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password || "",
        );
        if (!isPasswordValid) return null;

        return {
          ...user,
          access_token: jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || "",
            { expiresIn: "1d" },
          ),
        };
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }: any) {
      if (account?.provider === "azure-ad") {
        const email = profile?.email;
        const admin = await prisma.user.findFirst({
          where: {
            active: true,
            email: {
              equals: email,
              mode: "insensitive",
            },
            deleted_at: null,
          },
        });
        if (!admin) throw new Error("SSO_USER_NOT_FOUND");

        token.id = admin.id;
        token.name = admin.name;
        token.email = admin.email;
        token.role_id = admin.role_id;
        token.access_token = jwt.sign(
          { id: admin.id },
          process.env.JWT_SECRET || "",
          { expiresIn: "1d" },
        );
      } else if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role_id = user.role_id;
        token.access_token = user.access_token;
      }

      return token;
    },

    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role_id = token.role_id;
      session.user.access_token = token.access_token;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
