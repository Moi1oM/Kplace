import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function createContext(req: NextRequest) {
  const session = await auth();

  return {
    prisma,
    session,
    userId: session.userId,
    req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;