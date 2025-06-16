import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
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

    const collection = await prisma.wardrobe.findFirst({
      where: {
        id: params.id,
        creatorId: userId
      },
      include: {
        items: {
          include: {
            clothingItem: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      privacy: collection.isPublic ? 'public' : 'private',
      itemCount: collection._count.items,
      items: collection.items.map(item => item.clothingItem),
      style: collection.style,
      season: collection.season,
      occasion: collection.occasion,
      createdAt: collection.createdAt
    })

  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params in Next.js 15
    const { id } = await params

    // Get the user ID - the session uses 'uid' field
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const { privacy } = body

    // Verify the collection belongs to the user
    const existingCollection = await prisma.wardrobe.findFirst({
      where: {
        id: id,  // Use the awaited id
        creatorId: userId
      }
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Update the collection
    const updatedCollection = await prisma.wardrobe.update({
      where: {
        id: id  // Use the awaited id
      },
      data: {
        isPublic: privacy === 'public'
      }
    })

    return NextResponse.json({
      id: updatedCollection.id,
      privacy: updatedCollection.isPublic ? 'public' : 'private'
    })

  } catch (error) {
    console.error("Error updating collection:", error)
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    )
  }
} 