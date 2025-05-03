import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { plushieId, text } = await req.json();
  try {
    const comment = await prisma.comment.create({
      data: {
        content: text,
        author: { connect: { id: session.user.uid } },
        plushie: { connect: { id: plushieId } },
      },
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

  // We'll parse the URL's query param, e.g. /api/comment?commentId=abc123
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  try {
    // 1) Find the comment
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 2) Verify ownership
    if (existing.authorId !== session.user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Delete
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
  const plushieId = searchParams.get("plushieId");
  if (!plushieId) {
    return NextResponse.json({ error: "Missing plushieId" }, { status: 400 });
  }
  try {
    const comments = await prisma.comment.findMany({
      where: { plushieId },
      orderBy: { createdAt: "asc" },
      include: { author: true },
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
