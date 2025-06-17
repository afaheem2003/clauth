import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if waitlist is enabled
    const waitlistEnabled = process.env.WAITLIST_ENABLED === 'true'
    if (!waitlistEnabled) {
      return NextResponse.json({ error: 'Waitlist not enabled' }, { status: 400 })
    }

    // Find the user and check if they're admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't delete admin users
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 })
    }

    // Delete the user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete related data first (due to foreign key constraints)
      await tx.vote.deleteMany({ where: { userId } })
      await tx.preorder.deleteMany({ where: { userId } })
      await tx.comment.deleteMany({ where: { authorId: userId } })
      await tx.like.deleteMany({ where: { userId } })
      await tx.wardrobeItem.deleteMany({ 
        where: { wardrobe: { creatorId: userId } } 
      })
      await tx.wardrobe.deleteMany({ where: { creatorId: userId } })
      await tx.follow.deleteMany({ 
        where: { OR: [{ followerId: userId }, { followingId: userId }] } 
      })
      await tx.clothingItem.deleteMany({ where: { creatorId: userId } })
      await tx.dailyUsage.deleteMany({ where: { userId } })
      await tx.userCredits.deleteMany({ where: { userId } })
      await tx.designEditHistory.deleteMany({ where: { userId } })
      await tx.boosterPurchase.deleteMany({ where: { userId } })
      await tx.creditTransaction.deleteMany({ where: { userId } })
      await tx.groupMember.deleteMany({ where: { userId } })
      await tx.group.deleteMany({ where: { creatorId: userId } })
      await tx.challengeSubmission.deleteMany({ where: { userId } })
      await tx.submissionUpvote.deleteMany({ where: { userId } })
      await tx.competitionParticipant.deleteMany({ where: { userId } })
      
      // Delete auth-related data
      await tx.session.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })
      
      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    console.log(`Deleted non-admin user: ${user.email} (${userId}) during waitlist mode`)

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUser: { id: userId, email: user.email }
    })

  } catch (error) {
    console.error('Error deleting non-admin user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
} 