import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CollectionsClient from "./CollectionsClient"

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  try {
    // Get the user ID - the session uses 'uid' field
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    
    if (!userId) {
      console.error("No user ID found in session:", session.user)
      redirect("/login")
    }

    // Fetch collections from database using Wardrobe model with actual items
    const collections = await prisma.wardrobe.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format and parse rich metadata
    const transformedCollections = collections.map(collection => {
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

      return {
        id: collection.id,
        name: collection.name,
        description: parsedData.notes,
        privacy: collection.isPublic ? 'public' : 'private',
        itemCount: collection._count.items,
        items: collection.items.map(item => item.clothingItem), // Include actual items for preview
        style: collection.style,
        season: collection.season, // Keep for backward compatibility
        seasons: parsedData.metadata?.seasons || (collection.season ? [collection.season] : []), // New seasons array
        occasion: collection.occasion,
        // Rich metadata
        purpose: parsedData.metadata?.purpose,
        colorPalette: parsedData.metadata?.colorPalette || [],
        occasions: parsedData.metadata?.occasions || [],
        createdAt: collection.createdAt.toISOString()
      }
    })

    console.log("Transformed collections with rich data:", transformedCollections) // Debug log

    return (
      <div className="min-h-screen bg-gray-50">
        <CollectionsClient initialCollections={transformedCollections} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching collections:", error)
    return (
      <div className="min-h-screen bg-gray-50">
        <CollectionsClient initialCollections={[]} />
      </div>
    )
  }
} 