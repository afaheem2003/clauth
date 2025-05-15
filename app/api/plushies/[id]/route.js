// app/api/plushies/[id]/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma'
import { storage } from '@/lib/firebase-admin'

// DELETE /api/plushies/[id]
export async function DELETE(request, context) {
  const { params } = await context
  const session    = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // this is the plushie ID
  const plushieId = params.id

  // load the plushie record so we know its image URL
  const existing = await prisma.plushie.findUnique({
    where: { id: plushieId }
  })

  if (!existing || existing.creatorId !== session.user.uid) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  // delete image from Firebase Storage if it's a Firebase URL
  const imageUrl = existing.imageUrl || ''
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const bucket   = storage.bucket()
      const filePath = decodeURIComponent(imageUrl.split('/o/')[1]?.split('?')[0] || '')
      if (filePath) await bucket.file(filePath).delete()
    } catch (e) {
      console.warn('⚠️ Firebase delete failed:', e)
    }
  }

  // now delete the plushie
  await prisma.plushie.delete({ where: { id: plushieId } })

  return NextResponse.json({ success: true })
}

// GET /api/plushies/[id]
export async function GET(request, context) {
  const { params } = await context
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
  const { params } = await context
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
