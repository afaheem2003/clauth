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
    // Check which table the item exists in
    const [clothingItem, uploadedDesign] = await Promise.all([
      prisma.clothingItem.findUnique({ where: { id: clothingItemId } }),
      prisma.uploadedDesign.findUnique({ where: { id: clothingItemId } })
    ]);

    const designItem = clothingItem || uploadedDesign;
    if (!designItem) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const isUploadedDesign = !!uploadedDesign;
    let comment;

    if (isUploadedDesign) {
      comment = await prisma.uploadedDesignComment.create({
        data: {
          content: content,
          author: { connect: { id: session.user.uid } },
          uploadedDesign: { connect: { id: clothingItemId } },
          ...(parentId && { parent: { connect: { id: parentId } } }),
        },
        include: { author: true },
      });
    } else {
      comment = await prisma.comment.create({
        data: {
          content: content,
          author: { connect: { id: session.user.uid } },
          clothingItem: { connect: { id: clothingItemId } },
          ...(parentId && { parent: { connect: { id: parentId } } }),
        },
        include: { author: true },
      });
    }

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
    // Check both comment tables
    const [regularComment, uploadedDesignComment] = await Promise.all([
      prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
      }),
      prisma.uploadedDesignComment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
      })
    ]);

    const existing = regularComment || uploadedDesignComment;
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existing.authorId !== session.user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from the appropriate table
    if (regularComment) {
      await prisma.comment.delete({ where: { id: commentId } });
    } else {
      await prisma.uploadedDesignComment.delete({ where: { id: commentId } });
    }

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
    // Check which table the item exists in and fetch appropriate comments
    const [clothingItem, uploadedDesign] = await Promise.all([
      prisma.clothingItem.findUnique({ where: { id: clothingItemId } }),
      prisma.uploadedDesign.findUnique({ where: { id: clothingItemId } })
    ]);

    const isUploadedDesign = !!uploadedDesign;
    let comments;

    if (isUploadedDesign) {
      comments = await prisma.uploadedDesignComment.findMany({
        where: { uploadedDesignId: clothingItemId, parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: true,
          replies: {
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    } else {
      comments = await prisma.comment.findMany({
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
    }

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
