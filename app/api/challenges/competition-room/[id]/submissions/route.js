import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = params.id;
    
    // Check if user is a participant in this room
    const isParticipant = await prisma.competitionParticipant.findFirst({
      where: {
        roomId: roomId,
        userId: session.user.uid
      }
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all submissions for this room
    const submissions = await prisma.challengeSubmission.findMany({
      where: {
        competitionRoomId: roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true
          }
        },
        _count: {
          select: {
            upvotes: true
          }
        }
      }
    });

    // Separate qualified and unqualified submissions
    const qualifiedSubmissions = submissions.filter(s => s.isEligibleForCompetition);
    const unqualifiedSubmissions = submissions.filter(s => !s.isEligibleForCompetition);

    // Sort qualified submissions by upvote count (descending), then by submission time (ascending)
    qualifiedSubmissions.sort((a, b) => {
      const upvoteDiff = b._count.upvotes - a._count.upvotes;
      if (upvoteDiff !== 0) return upvoteDiff;
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

    // Sort unqualified submissions by submission time (ascending)
    unqualifiedSubmissions.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    // Combine all submissions for clothing item lookup
    const allSubmissions = [...qualifiedSubmissions, ...unqualifiedSubmissions];

    // Fetch clothing items for submissions that have clothingItemId
    const clothingItemIds = allSubmissions
      .filter(s => s.clothingItemId)
      .map(s => s.clothingItemId);
    
    const clothingItems = clothingItemIds.length > 0 
      ? await prisma.clothingItem.findMany({
          where: {
            id: { in: clothingItemIds }
          },
          select: {
            id: true,
            description: true,
            frontImage: true,
            backImage: true,
            imageUrl: true
          }
        })
      : [];

    // Create a map for quick lookup
    const clothingItemMap = new Map(clothingItems.map(item => [item.id, item]));

    // Format submissions for frontend
    const formatSubmission = (submission) => {
      const clothingItem = submission.clothingItemId ? clothingItemMap.get(submission.clothingItemId) : null;
      
      return {
        id: submission.id,
        userId: submission.userId,
        clothingItemId: submission.clothingItemId,
        generatedImageUrl: clothingItem?.frontImage || clothingItem?.imageUrl || submission.generatedImageUrl,
        outfitDescription: clothingItem?.description || submission.outfitDescription,
        submittedAt: submission.submittedAt,
        upvoteCount: submission._count.upvotes,
        isEligibleForCompetition: submission.isEligibleForCompetition,
        user: submission.user
      };
    };

    const formattedQualified = qualifiedSubmissions.map(formatSubmission);
    const formattedUnqualified = unqualifiedSubmissions.map(formatSubmission);

    return NextResponse.json({
      submissions: [...formattedQualified, ...formattedUnqualified], // For backward compatibility
      qualifiedSubmissions: formattedQualified,
      unqualifiedSubmissions: formattedUnqualified
    });

  } catch (error) {
    console.error('Error fetching competition room submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 