import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CollectionDetailClient from "./CollectionDetailClient"

export default async function CollectionDetailPage({ params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const { id: collectionId } = await params

  if (!collectionId) {
    redirect("/collections")
  }

  try {
    // Get the user ID - the session uses 'uid' field
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    
    if (!userId) {
      console.error("No user ID found in session:", session.user)
      redirect("/collections")
    }

    // Fetch the collection with all its items
    const collection = await prisma.wardrobe.findFirst({
      where: {
        id: collectionId,
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
      redirect("/collections")
    }

    // Parse the rich metadata from description field
    let parsedData = { notes: "", metadata: {} }
    try {
      if (collection.description) {
        parsedData = JSON.parse(collection.description)
      }
    } catch (error) {
      // If parsing fails, treat description as plain text
      parsedData = { notes: collection.description || "", metadata: {} }
    }

    const collectionData = {
      id: collection.id,
      name: collection.name,
      description: parsedData.notes,
      notes: parsedData.notes,
      privacy: collection.isPublic ? 'public' : 'private',
      itemCount: collection._count.items,
      items: collection.items.map(item => item.clothingItem),
      style: collection.style,
      season: collection.season,
      occasion: collection.occasion,
      // Flatten metadata to top level for easier access
      purpose: parsedData.metadata?.purpose,
      colorPalette: parsedData.metadata?.colorPalette || [],
      occasions: parsedData.metadata?.occasions || [],
      // Banner settings
      bannerType: collection.bannerType || 'gradient',
      bannerImage: collection.bannerImage,
      bannerColor: collection.bannerColor || '#667eea',
      bannerGradient: collection.bannerGradient || ['#667eea', '#764ba2'],
      templateType: collection.templateType || 'gallery',
      createdAt: collection.createdAt.toISOString()
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <CollectionDetailClient collection={collectionData} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching collection:", error)
    redirect("/collections")
  }
} 