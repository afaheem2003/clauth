import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 15
    const { id } = await params

    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    const body = await request.json()
    const { bannerType, bannerImage, bannerColor, bannerGradient } = body

    // Verify the collection belongs to the user
    const existingCollection = await prisma.wardrobe.findFirst({
      where: {
        id: id,  // Use the awaited id
        creatorId: userId
      }
    })

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Update the collection banner
    const updatedCollection = await prisma.wardrobe.update({
      where: {
        id: id  // Use the awaited id
      },
      data: {
        bannerType,
        bannerImage,
        bannerColor,
        bannerGradient
      }
    })

    return NextResponse.json({
      id: updatedCollection.id,
      bannerType: updatedCollection.bannerType,
      bannerImage: updatedCollection.bannerImage,
      bannerColor: updatedCollection.bannerColor,
      bannerGradient: updatedCollection.bannerGradient
    })

  } catch (error) {
    console.error('Error updating collection banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
} 