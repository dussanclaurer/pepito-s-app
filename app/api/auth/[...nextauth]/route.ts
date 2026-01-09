// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"]
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
