// /api/comment/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { Filter } from "bad-words";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clothingItemId, content, parentId = null } = await req.json();

  const filter = new Filter();
  if (filter.isProfane(content)) {
    return NextResponse.json(
      { error: "Inappropriate language detected" },
      { status: 400 }
    );
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content: content,
        author: { connect: { id: session.user.uid } },
        clothingItem: { connect: { id: clothingItemId } },
        ...(parentId && { parent: { connect: { id: parentId } } }), // ✅ fixed
      },
      include: { author: true },
    });

    return NextResponse.json({ comment });
  } catch (err) {
    console.error("Error posting comment:", err);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  try {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existing.authorId !== session.user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clothingItemId = searchParams.get("clothingItemId");

  if (!clothingItemId) {
    return NextResponse.json({ error: "Missing clothingItemId" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { clothingItemId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
