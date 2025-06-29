import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Get current voting round and applications (for approved users)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only approved users can vote
    if (session.user.waitlistStatus !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved community members can participate in voting' 
      }, { status: 403 })
    }

    // Get the current active voting round
    const activeRound = await prisma.votingRound.findFirst({
      where: { 
        isActive: true,
        startTime: { lte: new Date() },
        endTime: { gte: new Date() }
      },
      include: {
        applications: {
          include: {
            application: {
              include: {
                applicant: {
                  select: { 
                    name: true, 
                    displayName: true,
                    createdAt: true 
                  }
                },
                clothingItem: {
                  select: { 
                    name: true, 
                    description: true,
                    imageUrl: true, 
                    backImage: true,
                    itemType: true,
                    gender: true,
                    quality: true
                  }
                }
              }
            },
            votes: {
              where: { voterId: session.user.uid },
              select: { isUpvote: true }
            }
          }
        }
      }
    })

    if (!activeRound) {
      return NextResponse.json({ 
        message: 'No active voting round at the moment',
        hasActiveRound: false
      })
    }

    // Get user's voting progress
    const userVotes = await prisma.applicationVote.count({
      where: {
        voterId: session.user.uid,
        votingRoundId: activeRound.id
      }
    })

    // Format applications with user's vote status
    const applications = activeRound.applications.map(roundApp => ({
      id: roundApp.id,
      application: {
        id: roundApp.application.id,
        applicant: {
          name: roundApp.application.applicant.displayName || roundApp.application.applicant.name,
          memberSince: roundApp.application.applicant.createdAt
        },
        clothingItem: roundApp.application.clothingItem,
        referralCodes: roundApp.application.referralCodes
      },
      userVote: roundApp.votes.length > 0 ? roundApp.votes[0].isUpvote : null, // null = not voted
      upvotes: roundApp.upvotes,
      totalVotes: roundApp.totalVotes
    }))

    return NextResponse.json({
      hasActiveRound: true,
      round: {
        id: activeRound.id,
        name: activeRound.name,
        description: activeRound.description,
        endTime: activeRound.endTime,
        totalApplications: applications.length
      },
      applications,
      userProgress: {
        votesCount: userVotes,
        totalApplications: applications.length,
        isComplete: userVotes === applications.length
      }
    })

  } catch (error) {
    console.error('Get voting round error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Submit a vote (for approved users)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only approved users can vote
    if (session.user.waitlistStatus !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved community members can participate in voting' 
      }, { status: 403 })
    }

    const { roundApplicationId, isUpvote } = await request.json()

    if (!roundApplicationId || typeof isUpvote !== 'boolean') {
      return NextResponse.json({ 
        error: 'Round application ID and vote direction are required' 
      }, { status: 400 })
    }

    // Get the round application and verify it's in an active round
    const roundApplication = await prisma.votingRoundApplication.findUnique({
      where: { id: roundApplicationId },
      include: {
        votingRound: true,
        application: {
          include: {
            applicant: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!roundApplication) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 })
    }

    if (!roundApplication.votingRound.isActive) {
      return NextResponse.json({ 
        error: 'This voting round is no longer active' 
      }, { status: 400 })
    }

    if (new Date() > roundApplication.votingRound.endTime) {
      return NextResponse.json({ 
        error: 'Voting period has ended' 
      }, { status: 400 })
    }

    // Check if user is trying to vote on their own application
    if (roundApplication.application.applicantId === session.user.uid) {
      return NextResponse.json({ 
        error: 'You cannot vote on your own application' 
      }, { status: 400 })
    }

    // Upsert the vote (update if exists, create if not)
    const vote = await prisma.applicationVote.upsert({
      where: {
        voterId_roundApplicationId: {
          voterId: session.user.uid,
          roundApplicationId: roundApplicationId
        }
      },
      update: {
        isUpvote
      },
      create: {
        voterId: session.user.uid,
        votingRoundId: roundApplication.votingRoundId,
        roundApplicationId: roundApplicationId,
        isUpvote
      }
    })

    // Update vote counts on the round application
    const votes = await prisma.applicationVote.findMany({
      where: { roundApplicationId }
    })

    const upvotes = votes.filter(v => v.isUpvote).length
    const downvotes = votes.filter(v => !v.isUpvote).length
    const totalVotes = upvotes + downvotes
    const approvalRate = totalVotes > 0 ? upvotes / totalVotes : 0

    await prisma.votingRoundApplication.update({
      where: { id: roundApplicationId },
      data: {
        upvotes,
        downvotes,
        totalVotes,
        approvalRate
      }
    })

    console.log(`User ${session.user.email} voted ${isUpvote ? 'up' : 'down'} on application by ${roundApplication.application.applicant.name}`)

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        isUpvote,
        updatedCounts: {
          upvotes,
          downvotes,
          totalVotes,
          approvalRate
        }
      }
    })

  } catch (error) {
    console.error('Submit vote error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 