import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fix: await params before accessing properties
    const { id: collectionId } = await params
    const { templateType } = await request.json()

    if (!templateType || !['minimalist', 'gallery', 'grid', 'magazine'].includes(templateType)) {
      return NextResponse.json({ error: "Invalid template type" }, { status: 400 })
    }

    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId

    // Check if collection exists and user owns it
    const existingCollection = await prisma.wardrobe.findFirst({
      where: {
        id: collectionId,
        creatorId: userId
      }
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Update the collection template
    const updatedCollection = await prisma.wardrobe.update({
      where: {
        id: collectionId
      },
      data: {
        templateType
      }
    })

    return NextResponse.json({ 
      success: true, 
      templateType: updatedCollection.templateType 
    })

  } catch (error) {
    console.error("Error updating collection template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
} 