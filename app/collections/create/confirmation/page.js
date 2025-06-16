import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ConfirmationClient from "./ConfirmationClient"

export default async function ConfirmationPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const collectionId = searchParams.id

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

    // Fetch the actual collection from database (using Wardrobe model)
    const collection = await prisma.wardrobe.findFirst({
      where: {
        id: collectionId,
        creatorId: userId
      },
      include: {
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

    const collectionData = {
      id: collection.id,
      name: collection.name,
      privacy: collection.isPublic ? 'public' : 'private',
      itemCount: collection._count.items,
      createdAt: collection.createdAt.toISOString()
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <ConfirmationClient collection={collectionData} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching collection:", error)
    redirect("/collections")
  }
} 