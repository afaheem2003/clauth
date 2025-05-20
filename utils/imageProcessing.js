export const ANGLES = {
  FRONT: 'front',
  BACK: 'back'
};

/**
 * Generates the storage path for an angle image
 * @param {string} userId - The user's ID
 * @param {string} clothingItemId - The clothing item's ID
 * @param {string} angle - The angle identifier (from ANGLES)
 * @returns {string} The storage path
 */
export function getAngleImagePath(userId, clothingItemId, angle) {
  return `users/${userId}/clothing/${clothingItemId}/${angle}.png`;
} 