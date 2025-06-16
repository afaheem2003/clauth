import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Session user:", session.user) // Debug log

    const body = await request.json()
    const {
      name,
      purpose,
      style,
      seasons,
      occasions,
      colorPalette,
      items,
      privacy,
      notes
    } = body

    console.log("Collection data being stored:", body) // Debug log

    // Validate required fields
    if (!purpose || !style || !seasons || seasons.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields: purpose, style, and at least one season are required" 
      }, { status: 400 })
    }

    // Get the user ID - the session uses 'uid' field
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    
    if (!userId) {
      console.error("No user ID found in session:", session.user)
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    // Create the collection (using Wardrobe model) - store rich metadata as JSON
    const collection = await prisma.wardrobe.create({
      data: {
        name: name || "Untitled Collection",
        description: notes || "",
        isPublic: privacy === 'public',
        creatorId: userId,
        style: style || null,
        season: seasons?.join(', ') || null,
        occasion: occasions?.join(', ') || null,
        // Store rich metadata as JSON in a text field (we'll need to add this to schema or use existing field)
        // For now, let's use the description field to store structured data
      }
    })

    // Store the rich metadata separately - we'll create a JSON structure
    const metadata = {
      purpose,
      seasons, // Store as array in metadata
      colorPalette,
      occasions,
      originalDescription: notes
    }

    // Update the collection with rich metadata stored as JSON in description
    await prisma.wardrobe.update({
      where: { id: collection.id },
      data: {
        description: JSON.stringify({
          notes: notes || "",
          metadata: metadata
        })
      }
    })

    // If items are provided, create the collection items (using WardrobeItem model)
    if (items && items.length > 0) {
      const collectionItems = items.map(item => ({
        wardrobeId: collection.id,
        clothingItemId: item.id
      }))

      await prisma.wardrobeItem.createMany({
        data: collectionItems
      })
    }

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      privacy: collection.isPublic ? 'public' : 'private',
      itemCount: items?.length || 0
    })

  } catch (error) {
    console.error("Error creating collection:", error)
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID - the session uses 'uid' field
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const collections = await prisma.wardrobe.findMany({
      where: {
        creatorId: userId
      },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(collections)

  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    )
  }
} 