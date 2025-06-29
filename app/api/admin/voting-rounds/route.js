import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Get all voting rounds (admin only)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rounds = await prisma.votingRound.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        applications: {
          include: {
            application: {
              include: {
                applicant: {
                  select: { name: true, email: true }
                },
                clothingItem: {
                  select: { 
                    name: true, 
                    imageUrl: true, 
                    itemType: true, 
                    gender: true, 
                    quality: true 
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            votes: true,
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ rounds })

  } catch (error) {
    console.error('Get voting rounds error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Create new voting round (admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      description, 
      durationHours = 72, // Default 3 days
      maxApplications = 20,
      approvalPercentage = 30, // Top 30% make it through
      minVotes = 5,
      startImmediately = false
    } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if there's already an active round
    const activeRound = await prisma.votingRound.findFirst({
      where: { isActive: true }
    })

    if (activeRound && startImmediately) {
      return NextResponse.json({ 
        error: 'There is already an active voting round. Please end it first.' 
      }, { status: 400 })
    }

    const startTime = startImmediately ? new Date() : new Date(Date.now() + 60000) // Start in 1 minute if not immediate
    const endTime = new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000))

    // Get pending applications to include in this round
    const pendingApplications = await prisma.waitlistDesignApplication.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        applicant: {
          select: { name: true, email: true }
        },
        clothingItem: {
          select: { 
            name: true, 
            imageUrl: true, 
            description: true, 
            itemType: true, 
            gender: true, 
            quality: true 
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // FIFO - first in, first out
      },
      take: maxApplications
    })

    if (pendingApplications.length === 0) {
      return NextResponse.json({ 
        error: 'No pending applications to include in voting round' 
      }, { status: 400 })
    }

    // Create the voting round
    const votingRound = await prisma.votingRound.create({
      data: {
        name,
        description,
        startTime,
        endTime,
        isActive: startImmediately,
        maxApplications,
        approvalPercentage,
        minVotes,
        createdById: session.user.uid
      }
    })

    // Add applications to the voting round
    const roundApplications = await Promise.all(
      pendingApplications.map(app => 
        prisma.votingRoundApplication.create({
          data: {
            votingRoundId: votingRound.id,
            applicationId: app.id
          }
        })
      )
    )

    // Update application status to IN_VOTING
    await prisma.waitlistDesignApplication.updateMany({
      where: {
        id: { in: pendingApplications.map(app => app.id) }
      },
      data: {
        status: 'IN_VOTING'
      }
    })

    console.log(`Created voting round "${name}" with ${pendingApplications.length} applications`)

    return NextResponse.json({
      success: true,
      votingRound: {
        ...votingRound,
        applicationsCount: pendingApplications.length
      }
    })

  } catch (error) {
    console.error('Create voting round error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// End voting round and process results (admin only)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roundId, action } = await request.json()

    if (!roundId || !action) {
      return NextResponse.json({ 
        error: 'Round ID and action are required' 
      }, { status: 400 })
    }

    if (action === 'end') {
      // End the voting round and process results
      const round = await prisma.votingRound.findUnique({
        where: { id: roundId },
        include: {
          applications: {
            include: {
              application: {
                include: {
                  applicant: true
                }
              },
              votes: true
            }
          }
        }
      })

      if (!round) {
        return NextResponse.json({ error: 'Voting round not found' }, { status: 404 })
      }

      if (!round.isActive) {
        return NextResponse.json({ error: 'Voting round is not active' }, { status: 400 })
      }

      // Calculate results for each application
      let approvedCount = 0
      const results = []

      // First pass: calculate approval rates for all applications
      const applicationsWithRates = []
      for (const roundApp of round.applications) {
        const upvotes = roundApp.votes.filter(vote => vote.isUpvote).length
        const downvotes = roundApp.votes.filter(vote => !vote.isUpvote).length
        const totalVotes = upvotes + downvotes
        const approvalRate = totalVotes > 0 ? upvotes / totalVotes : 0

        applicationsWithRates.push({
          roundApp,
          upvotes,
          downvotes,
          totalVotes,
          approvalRate
        })
      }

      // Filter applications that meet minimum vote requirement
      const eligibleApplications = applicationsWithRates.filter(app => app.totalVotes >= round.minVotes)
      
      // Sort by approval rate (highest first)
      eligibleApplications.sort((a, b) => b.approvalRate - a.approvalRate)
      
      // Calculate how many to approve (top X percentage)
      const approvalCount = Math.ceil(eligibleApplications.length * (round.approvalPercentage / 100))
      
      // Approve the top applications
      const approvedApplications = eligibleApplications.slice(0, approvalCount)
      const approvedIds = new Set(approvedApplications.map(app => app.roundApp.id))

      // Second pass: update all applications
      for (const appData of applicationsWithRates) {
        const { roundApp, upvotes, downvotes, totalVotes, approvalRate } = appData
        const wasApproved = approvedIds.has(roundApp.id)

        // Update the round application
        await prisma.votingRoundApplication.update({
          where: { id: roundApp.id },
          data: {
            upvotes,
            downvotes,
            totalVotes,
            approvalRate,
            wasApproved
          }
        })

        // Update the main application status
        const newStatus = wasApproved ? 'APPROVED' : 'WAITLISTED'
        await prisma.waitlistDesignApplication.update({
          where: { id: roundApp.applicationId },
          data: {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedBy: session.user.uid
          }
        })

        // Update user status if approved
        if (wasApproved) {
          await prisma.user.update({
            where: { id: roundApp.application.applicantId },
            data: { waitlistStatus: 'APPROVED' }
          })
          approvedCount++
        }

        results.push({
          applicationId: roundApp.applicationId,
          applicantName: roundApp.application.applicant.name,
          upvotes,
          downvotes,
          totalVotes,
          approvalRate,
          wasApproved
        })
      }

      // Update the voting round
      await prisma.votingRound.update({
        where: { id: roundId },
        data: {
          isActive: false,
          endTime: new Date(),
          applicationsApproved: approvedCount,
          totalVotes: results.reduce((sum, r) => sum + r.totalVotes, 0)
        }
      })

      console.log(`Ended voting round "${round.name}" - ${approvedCount} applications approved`)

      return NextResponse.json({
        success: true,
        message: `Voting round ended. ${approvedCount} applications approved.`,
        results
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Update voting round error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 