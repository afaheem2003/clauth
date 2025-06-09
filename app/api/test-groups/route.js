import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        handle: true,
        inviteCode: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json({
      groups,
      urlExamples: groups.map(group => ({
        id: group.id,
        name: group.name,
        handle: group.handle,
        newUrl: `/challenges/groups/@${group.handle}`,
        oldUrl: `/challenges/groups/${group.id}`
      }))
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 