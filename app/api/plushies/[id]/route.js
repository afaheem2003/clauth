// app/api/plushies/[id]/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import supabase from '@/lib/supabase-admin'

// DELETE /api/plushies/[id]
export async function DELETE(request, context) {
  const { params } = context
  const session    = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const plushieId = params.id

  const existing = await prisma.plushie.findUnique({
    where: { id: plushieId }
  })

  if (!existing || existing.creatorId !== session.user.uid) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  // ✅ Supabase Storage image deletion
  const imageUrl = existing.imageUrl || ''
  if (imageUrl.includes('supabase.co/storage/v1/object/public')) {
    try {
      const urlParts = imageUrl.split('/object/public/')[1]
      if (urlParts) {
        const filePath = decodeURIComponent(urlParts)
        await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .remove([filePath])
      }
    } catch (e) {
      console.warn('⚠️ Supabase delete failed:', e)
    }
  }

  await prisma.plushie.delete({ where: { id: plushieId } })
  return NextResponse.json({ success: true })
}

// GET /api/plushies/[id]
export async function GET(request, context) {
  const { params } = context
  try {
    const plushie = await prisma.plushie.findUnique({ where: { id: params.id } })
    if (!plushie) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ plushie })
  } catch (err) {
    console.error('❌ Fetch failed:', err)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

// PUT /api/plushies/[id]
export async function PUT(request, context) {
  const { params } = context
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()
  try {
    const updated = await prisma.plushie.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({ plushie: updated })
  } catch (err) {
    console.error('❌ Update failed:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
