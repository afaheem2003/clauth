// Helper function to convert internal quality names to user-facing names
export function getQualityDisplayName(quality) {
  switch (quality) {
    case 'low': return 'Sketch';
    case 'medium': return 'Studio';
    case 'high': return 'Runway';
    default: return quality;
  }
} 