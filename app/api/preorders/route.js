// app/api/preorders/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  // Check if shop is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_SHOP !== 'true') {
    return NextResponse.json(
      { error: 'Shop is not available' },
      { status: 404 }
    );
  }

  // 1) require logged‑in user
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json([], { status: 200 });
  }
  const userId = session.user.uid;

  // 1) Auth check complete
  // 2) fetch all of their pre‑orders, including the clothing item details
  const records = await prisma.preorder.findMany({
    where: { userId: userId },
    include: {
      payment: true,
      clothingItem: {
        select: {
          name: true,
          imageUrl: true,
          status: true,
          pledged: true,
          goal: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3) map into a simple shape
  const orders = records.map((o) => ({
    id: o.id,
    name: o.clothingItem.name,
    image: o.clothingItem.imageUrl,
    qty: o.quantity,
    total: o.price,
    status: o.status,
    canCancel: o.clothingItem.status === "PENDING",
    progress: o.clothingItem.status === "PENDING"
      ? "Pre-order Confirmed"
      : o.clothingItem.status === "IN_PRODUCTION"
      ? "In Production"
      : o.clothingItem.status === "SHIPPED"
      ? "Shipped"
      : o.clothingItem.status === "CANCELED"
      ? "Canceled"
      : "Delivered",
    pledged: o.clothingItem.pledged,
    goal: o.clothingItem.goal,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json(orders);
}
