import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        date: challenge.date,
        mainItem: challenge.mainItem,
        theme: challenge.theme,
        description: challenge.description,
        submissionDeadline: challenge.submissionDeadline,
        competitionStart: challenge.competitionStart,
        competitionEnd: challenge.competitionEnd,
        submissionCount: challenge._count.submissions,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated via PATCH
    const allowedFields = ['mainItem', 'theme', 'description', 'submissionDeadline', 'competitionStart', 'competitionEnd'];
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );

    // Validate data if provided
    if (filteredData.submissionDeadline) {
      const deadline = new Date(filteredData.submissionDeadline);
      const challenge = await prisma.dailyChallenge.findUnique({
        where: { id: params.id },
        select: { date: true }
      });
      
      if (challenge && deadline < challenge.date) {
        return NextResponse.json({ 
          error: 'Submission deadline must be on or after the challenge date' 
        }, { status: 400 });
      }
      
      filteredData.submissionDeadline = deadline;
    }

    // Validate competition start time
    if (filteredData.competitionStart) {
      filteredData.competitionStart = new Date(filteredData.competitionStart);
    }

    // Validate competition end time
    if (filteredData.competitionEnd) {
      filteredData.competitionEnd = new Date(filteredData.competitionEnd);
    }

    // Validate timeline logic if multiple fields are being updated
    if (filteredData.competitionStart && filteredData.submissionDeadline) {
      if (filteredData.competitionStart >= filteredData.submissionDeadline) {
        return NextResponse.json({ 
          error: 'Submission deadline must be after challenge reveal time' 
        }, { status: 400 });
      }
    }

    if (filteredData.competitionEnd && filteredData.submissionDeadline) {
      if (filteredData.competitionEnd <= filteredData.submissionDeadline) {
        return NextResponse.json({ 
          error: 'Voting deadline must be after submission deadline' 
        }, { status: 400 });
      }
    }

    const updatedChallenge = await prisma.dailyChallenge.update({
      where: { id: params.id },
      data: filteredData,
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      challenge: {
        id: updatedChallenge.id,
        date: updatedChallenge.date,
        mainItem: updatedChallenge.mainItem,
        theme: updatedChallenge.theme,
        description: updatedChallenge.description,
        submissionDeadline: updatedChallenge.submissionDeadline,
        competitionStart: updatedChallenge.competitionStart,
        competitionEnd: updatedChallenge.competitionEnd,
        submissionCount: updatedChallenge._count.submissions
      }
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if challenge has submissions
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge._count.submissions > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete challenge with existing submissions. Disable it instead.' 
      }, { status: 400 });
    }

    await prisma.dailyChallenge.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
} 