import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import supabase from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('banner')
    const collectionId = formData.get('collectionId')

    if (!file || !collectionId) {
      return NextResponse.json({ error: 'Missing file or collection ID' }, { status: 400 })
    }

    // Verify user owns the collection
    const userId = session.user.uid || session.user.id || session.user.sub || session.user.userId
    const collection = await prisma.wardrobe.findFirst({
      where: {
        id: collectionId,
        creatorId: userId
      }
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate structured path: collections/{userId}/{collectionId}/banner.{ext}
    const fileExtension = file.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const fileName = `banner-${timestamp}.${fileExtension}`
    const filePath = `collections/${userId}/${collectionId}/${fileName}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('clothingitemimages') // Using the same bucket as clothing items
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clothingitemimages')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl 
    })

  } catch (error) {
    console.error('Error uploading banner:', error)
    return NextResponse.json(
      { error: 'Failed to upload banner' },
      { status: 500 }
    )
  }
} 