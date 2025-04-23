// app/api/preorders/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/app/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  // 1) require logged‑in user
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json([], { status: 200 });
  }
  const userId = session.user.uid;

  // 2) fetch all of their pre‑orders, including the plushie details
  const records = await prisma.preorder.findMany({
    where: { userId },
    include: {
      plushie: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          pledged: true,
          goal: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3) map into a simple shape
  const orders = records.map((o) => ({
    id: o.id,
    name: o.plushie.name,
    image: o.plushie.imageUrl,
    status:
      o.plushie.status === "PENDING"
        ? "Awaiting Enough Pre‑Orders"
        : o.plushie.status === "IN_PRODUCTION"
        ? "In Production"
        : o.plushie.status === "SHIPPED"
        ? "Shipped"
        : o.plushie.status === "CANCELED"
        ? "Canceled"
        : "Unknown",
    price: `$${o.price.toFixed(2)}`,
    pledged: o.plushie.pledged,
    goal: o.plushie.goal,
    quantity: o.quantity,
  }));

  return NextResponse.json(orders);
}
