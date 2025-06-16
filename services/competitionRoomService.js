import prisma from '@/lib/prisma';

const MIN_ROOM_SIZE = 20;
const MAX_ROOM_SIZE = 30;

/**
 * Assigns a user to a competition room for a specific challenge
 * Creates new rooms as needed to maintain 20-30 participants per room
 */
export async function assignUserToCompetitionRoom(userId, challengeId) {
  try {
    // Check if user is already assigned to a room for this challenge
    const existingAssignment = await prisma.competitionParticipant.findFirst({
      where: {
        userId,
        room: {
          challengeId
        }
      },
      include: {
        room: true
      }
    });

    if (existingAssignment) {
      return existingAssignment.room;
    }

    // Get all rooms for this challenge with participant counts
    const rooms = await prisma.competitionRoom.findMany({
      where: {
        challengeId
      },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        roomNumber: 'asc'
      }
    });

    let targetRoom = null;

    // Find a room that has space (less than MAX_ROOM_SIZE participants)
    const availableRooms = rooms.filter(room => room._count.participants < MAX_ROOM_SIZE);
    
    if (availableRooms.length > 0) {
      // Randomly select from available rooms to ensure good distribution
      const randomIndex = Math.floor(Math.random() * availableRooms.length);
      targetRoom = availableRooms[randomIndex];
    } else {
      // Create a new room
      const nextRoomNumber = rooms.length > 0 ? Math.max(...rooms.map(r => r.roomNumber)) + 1 : 1;
      
      targetRoom = await prisma.competitionRoom.create({
        data: {
          challengeId,
          roomNumber: nextRoomNumber,
          maxParticipants: MAX_ROOM_SIZE
        }
      });
    }

    // Assign user to the room
    await prisma.competitionParticipant.create({
      data: {
        roomId: targetRoom.id,
        userId
      }
    });

    console.log(`[Competition Room] Assigned user ${userId} to room ${targetRoom.roomNumber} for challenge ${challengeId}`);
    
    return targetRoom;
  } catch (error) {
    console.error('[Competition Room] Error assigning user to room:', error);
    throw error;
  }
}

/**
 * Gets the competition room for a user and challenge
 */
export async function getUserCompetitionRoom(userId, challengeId) {
  try {
    const participation = await prisma.competitionParticipant.findFirst({
      where: {
        userId,
        room: {
          challengeId
        }
      },
      include: {
        room: {
          include: {
            _count: {
              select: {
                participants: true,
                submissions: true
              }
            }
          }
        }
      }
    });

    return participation?.room || null;
  } catch (error) {
    console.error('[Competition Room] Error getting user room:', error);
    throw error;
  }
}

/**
 * Gets all participants in a competition room
 */
export async function getRoomParticipants(roomId) {
  try {
    const participants = await prisma.competitionParticipant.findMany({
      where: {
        roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: {
        assignedAt: 'asc'
      }
    });

    return participants;
  } catch (error) {
    console.error('[Competition Room] Error getting room participants:', error);
    throw error;
  }
}

/**
 * Gets room statistics for a challenge
 */
export async function getChallengeRoomStats(challengeId) {
  try {
    const rooms = await prisma.competitionRoom.findMany({
      where: {
        challengeId
      },
      include: {
        _count: {
          select: {
            participants: true,
            submissions: true
          }
        }
      },
      orderBy: {
        roomNumber: 'asc'
      }
    });

    const totalParticipants = rooms.reduce((sum, room) => sum + room._count.participants, 0);
    const totalSubmissions = rooms.reduce((sum, room) => sum + room._count.submissions, 0);

    return {
      totalRooms: rooms.length,
      totalParticipants,
      totalSubmissions,
      rooms: rooms.map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        participantCount: room._count.participants,
        submissionCount: room._count.submissions,
        maxParticipants: room.maxParticipants
      }))
    };
  } catch (error) {
    console.error('[Competition Room] Error getting challenge room stats:', error);
    throw error;
  }
}

/**
 * Rebalances rooms if they become too uneven
 * This is a maintenance function that can be run periodically
 */
export async function rebalanceRooms(challengeId) {
  try {
    const rooms = await prisma.competitionRoom.findMany({
      where: {
        challengeId
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    // Check if rebalancing is needed
    const roomSizes = rooms.map(room => room.participants.length);
    const minSize = Math.min(...roomSizes);
    const maxSize = Math.max(...roomSizes);
    
    // If the difference is more than 10 people, consider rebalancing
    if (maxSize - minSize > 10) {
      console.log(`[Competition Room] Rebalancing needed for challenge ${challengeId}. Min: ${minSize}, Max: ${maxSize}`);
      
      // For now, just log the need for rebalancing
      // In the future, we could implement actual rebalancing logic
      // But we should be careful not to disrupt ongoing competitions
    }

    return {
      needsRebalancing: maxSize - minSize > 10,
      roomSizes,
      minSize,
      maxSize
    };
  } catch (error) {
    console.error('[Competition Room] Error rebalancing rooms:', error);
    throw error;
  }
} 