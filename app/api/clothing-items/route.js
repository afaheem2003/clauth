import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const whereClause = {
      isPublished: true,
      isDeleted: false,
    };

    // Fetch both AI-generated and uploaded designs
    const [clothingItems, uploadedDesigns] = await Promise.all([
      prisma.clothingItem.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.uploadedDesign.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      })
    ]);

    // Process and combine both types
    const processedClothingItems = clothingItems.map(item => ({
      ...item,
      designType: 'ai-generated',
      imageUrl: item.frontImage || item.imageUrl,
    }));

    const processedUploadedDesigns = uploadedDesigns.map(item => ({
      ...item,
      designType: 'uploaded',
      imageUrl: item.frontImage,
      backImage: item.backImage,
    }));

    // Combine and sort by creation date
    const allDesigns = [...processedClothingItems, ...processedUploadedDesigns]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ clothingItems: allDesigns });
  } catch (err) {
    console.error("Error fetching clothing items:", err);
    return NextResponse.json(
      { error: "Failed to fetch clothing items" },
      { status: 500 }
    );
  }
} 