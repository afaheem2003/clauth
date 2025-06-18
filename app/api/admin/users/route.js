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

// Get all users (admin only)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        displayName: true,
        waitlistStatus: true,
        phoneVerified: true,
        createdAt: true,
        _count: {
          select: {
            waitlistApplications: true,
            clothingItems: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Delete user account (admin only)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.uid) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Prevent deletion of other admins
    if (user.role === 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot delete admin accounts' 
      }, { status: 400 })
    }

    // Delete user and all related data (cascading deletes should handle most of this)
    // But we'll be explicit about the order to avoid foreign key issues
    
    console.log(`Starting deletion process for user ${userId}`)
    
    // 1. Delete phone verifications
    await prisma.phoneVerification.deleteMany({
      where: { userId }
    })
    console.log('Deleted phone verifications')

    // 2. Delete waitlist progress
    await prisma.waitlistProgress.deleteMany({
      where: { userId }
    })
    console.log('Deleted waitlist progress')

    // 3. Delete waitlist info
    await prisma.waitlistInfo.deleteMany({
      where: { userId }
    })
    console.log('Deleted waitlist info')

    // 4. Delete competition participants
    await prisma.competitionParticipant.deleteMany({
      where: { userId }
    })
    console.log('Deleted competition participants')

    // 5. Delete daily usage records
    await prisma.dailyUsage.deleteMany({
      where: { userId }
    })
    console.log('Deleted daily usage records')

    // 6. Delete user credits
    await prisma.userCredits.deleteMany({
      where: { userId }
    })
    console.log('Deleted user credits')

    // 7. Delete credit transactions
    await prisma.creditTransaction.deleteMany({
      where: { userId }
    })
    console.log('Deleted credit transactions')

    // 8. Delete booster purchases
    await prisma.boosterPurchase.deleteMany({
      where: { userId }
    })
    console.log('Deleted booster purchases')

    // 9. Delete group memberships
    await prisma.groupMember.deleteMany({
      where: { userId }
    })
    console.log('Deleted group memberships')

    // 10. Delete follows (both following and followers)
    await prisma.follow.deleteMany({
      where: { 
        OR: [
          { followerId: userId },
          { followingId: userId }
        ]
      }
    })
    console.log('Deleted follows')

    // 11. Delete wardrobe items and wardrobes
    const userWardrobes = await prisma.wardrobe.findMany({
      where: { creatorId: userId },
      select: { id: true }
    })
    
    if (userWardrobes.length > 0) {
      const wardrobeIds = userWardrobes.map(wardrobe => wardrobe.id)
      
      // Delete wardrobe items
      await prisma.wardrobeItem.deleteMany({
        where: { wardrobeId: { in: wardrobeIds } }
      })
      console.log('Deleted wardrobe items')
    }

    // 12. Delete wardrobes
    await prisma.wardrobe.deleteMany({
      where: { creatorId: userId }
    })
    console.log('Deleted wardrobes')

    // 13. Delete design edit history for user's items
    const userClothingItems = await prisma.clothingItem.findMany({
      where: { creatorId: userId },
      select: { id: true }
    })
    
    if (userClothingItems.length > 0) {
      const clothingItemIds = userClothingItems.map(item => item.id)
      
      // Delete design edit history
      await prisma.designEditHistory.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted design edit history')

      // Delete challenge submissions
      await prisma.challengeSubmission.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted challenge submissions')

      // Delete submission upvotes
      await prisma.submissionUpvote.deleteMany({
        where: { submissionId: { in: clothingItemIds } }
      })
      console.log('Deleted submission upvotes')

      // Delete votes on user's items
      await prisma.vote.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted votes')

      // Delete preorders on user's items
      await prisma.preorder.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted preorders')

      // Delete comments on user's items
      await prisma.comment.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted comments')

      // Delete likes on user's items
      await prisma.like.deleteMany({
        where: { clothingItemId: { in: clothingItemIds } }
      })
      console.log('Deleted likes')
    }

    // 14. Delete user's own votes, preorders, comments, likes on other items
    await prisma.vote.deleteMany({
      where: { userId }
    })
    await prisma.preorder.deleteMany({
      where: { userId }
    })
    await prisma.comment.deleteMany({
      where: { authorId: userId }
    })
    await prisma.like.deleteMany({
      where: { userId }
    })
    console.log('Deleted user interactions')

    // 15. Delete waitlist applications (this will cascade to delete clothing items)
    await prisma.waitlistDesignApplication.deleteMany({
      where: { applicantId: userId }
    })
    console.log('Deleted waitlist applications')

    // 16. Delete remaining clothing items created by user
    await prisma.clothingItem.deleteMany({
      where: { creatorId: userId }
    })
    console.log('Deleted clothing items')

    // 17. Delete sessions and accounts (NextAuth data)
    await prisma.session.deleteMany({
      where: { userId }
    })
    await prisma.account.deleteMany({
      where: { userId }
    })
    console.log('Deleted auth sessions and accounts')

    // 18. Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    })
    console.log('Deleted user')

    console.log(`Admin ${session.user.email} successfully deleted user ${user.email} (${user.name})`)

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted successfully`
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 