import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, status } = await request.json()

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 })
    }

    if (!['APPROVED', 'WAITLISTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { waitlistStatus: status }
    })

    // Update or create waitlist info
    const waitlistInfo = await prisma.waitlistInfo.upsert({
      where: { userId },
      update: {
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: status === 'APPROVED' ? session.user.uid : null
      },
      create: {
        userId,
        signupDate: updatedUser.createdAt,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: status === 'APPROVED' ? session.user.uid : null
      }
    })

    return NextResponse.json({ 
      message: `User ${status.toLowerCase()} successfully`,
      user: updatedUser,
      waitlistInfo
    })

  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent deleting admin users
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 })
    }

    // Delete user (this will cascade delete waitlist info due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
} 