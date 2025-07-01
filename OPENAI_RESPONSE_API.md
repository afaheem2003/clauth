# OpenAI Response API Integration

This document describes the comprehensive Response API integration for generating and editing clothing designs with context awareness and intelligent fallbacks.

## Overview

The Response API system allows for:

- **Context-aware design generation** - Generate both front and back views in a single conversation
- **Intelligent editing** - Edit designs using conversation history instead of reference images
- **Automatic fallback** - Seamlessly fall back to traditional methods if Response API fails
- **Session management** - Track and manage conversation sessions automatically

## Key Benefits

1. **Better Context Understanding**: GPT knows the design history and can make smarter edits
2. **Reduced Reference Image Complexity**: No need to manage multiple reference images
3. **Natural Language Processing**: "Add heart to front only" works correctly without bleed-through
4. **Consistent Design Evolution**: Maintains design consistency across multiple edits
5. **Robust Fallback**: Always has a backup method if Response API fails

## Configuration

Add these environment variables to your `.env` file:

```env
# Enable/disable Response API (default: false)
OPENAI_USE_RESPONSES_API=true

# Response API timeout in milliseconds (default: 300000 = 5 minutes)
OPENAI_RESPONSE_TIMEOUT=300000

# Session cleanup delay in milliseconds (default: 3600000 = 1 hour)
OPENAI_RESPONSE_CLEANUP_DELAY=3600000

# Maximum session lifetime in milliseconds (default: 7200000 = 2 hours)
OPENAI_RESPONSE_MAX_LIFETIME=7200000

# Image quality (standard/high)
OPENAI_IMAGE_QUALITY=high
```

## Core Functions

### 1. Smart Design Generation

**Primary Function**: `generateDesignWithSmartSelection(designData, options)`

```javascript
import { generateDesignWithSmartSelection } from '@/services/openaiService';

const designData = {
  itemDescription: 'premium cotton t-shirt',
  frontDesign: 'minimalist heart logo centered on chest',
  backDesign: 'clean solid color back',
  modelDetails: 'professional male model, athletic build',
  gender: 'MALE',
};

const result = await generateDesignWithSmartSelection(designData, {
  size: '1024x1536',
  quality: 'high',
});

// Result contains:
// - method: 'response_api' or 'traditional'
// - sessionId: string (if using Response API)
// - frontImage: base64 string
// - backImage: base64 string
// - hasSession: boolean
```

### 2. Smart Design Editing

**Primary Function**: `editDesignWithSmartSelection(editData, options)`

```javascript
import { editDesignWithSmartSelection } from '@/services/openaiService';

const editData = {
  sessionId: 'session_123', // From previous generation
  originalFrontImage: 'base64_front_image',
  originalBackImage: 'base64_back_image',
  referenceImages: [], // Only needed for fallback
  editPrompt: 'add a small star to the top right of the front view only',
};

const result = await editDesignWithSmartSelection(editData, {
  originalItemType: 't-shirt',
  originalColor: 'navy blue',
});

// Result contains:
// - method: 'response_api' or 'traditional'
// - sessionId: string (maintained for Response API)
// - frontImage: base64 string (edited)
// - backImage: base64 string (maintained or edited)
```

## Low-Level Functions

### Response API Functions

```javascript
// Generate both views in one session
const { sessionId, frontImage, backImage } = await generateBothViewsInSession(
  designData,
  options,
);

// Edit using session context
const { frontImage, backImage } = await editBothViewsInSession(
  sessionId,
  editPrompt,
  options,
);

// Session management
await cleanupSession(sessionId);
const isValid = await validateSession(sessionId);
const stats = getSessionStats();
```

### Traditional Method Preferences

```javascript
// Generation with preference
const result = await generateWithResponseAPIPreference(designData, {
  useResponsesAPI: true,
  fallbackToTraditional: true,
});

// Editing with preference
const result = await editWithResponseAPIPreference(
  sessionId,
  originalFrontImage,
  originalBackImage,
  referenceImages,
  editPrompt,
  options,
);
```

## Usage Examples

### Complete Design Workflow

```javascript
// 1. Generate initial design
const initialResult = await generateDesignWithSmartSelection({
  itemDescription: 'premium hoodie',
  frontDesign: 'geometric pattern in gold',
  backDesign: 'solid color with small logo',
  modelDetails: 'professional female model',
  gender: 'FEMALE',
});

const { sessionId, frontImage, backImage } = initialResult;

// 2. First edit - add element to front only
const edit1 = await editDesignWithSmartSelection({
  sessionId,
  originalFrontImage: frontImage,
  originalBackImage: backImage,
  editPrompt: 'add a small heart icon to the front left chest area',
});

// 3. Second edit - change back design
const edit2 = await editDesignWithSmartSelection({
  sessionId: edit1.sessionId,
  originalFrontImage: edit1.frontImage,
  originalBackImage: edit1.backImage,
  editPrompt: 'change the back to have a large mandala pattern',
});

// 4. Final edit - adjust colors
const final = await editDesignWithSmartSelection({
  sessionId: edit2.sessionId,
  originalFrontImage: edit2.frontImage,
  originalBackImage: edit2.backImage,
  editPrompt: 'change the gold elements to rose gold',
});

// 5. Cleanup session when done
await cleanupSession(final.sessionId);
```

### Error Handling

```javascript
try {
  const result = await generateDesignWithSmartSelection(designData);

  if (result.method === 'response_api') {
    console.log('Using Response API with session:', result.sessionId);
  } else {
    console.log('Using traditional method');
  }
} catch (error) {
  console.error('Design generation failed:', error.message);
  // Handle error appropriately
}
```

## Session Management

### Automatic Cleanup

- Sessions automatically expire after 1 hour of inactivity
- Maximum session lifetime is 2 hours
- Cleanup runs every 10 minutes

### Manual Session Management

```javascript
// Check session status
const status = getResponseAPIStatus();
console.log('Active sessions:', status.activeSessions);

// Validate specific session
const isValid = await validateSession(sessionId);

// Force cleanup
await forceCleanupSession(sessionId, 'user_requested');

// Cleanup all sessions
await cleanupAllSessions();
```

## Migration Guide

### From Traditional to Response API

**Before:**

```javascript
// Generate landscape image
const landscapeImage = await generateLandscapeImageWithOpenAI(prompt, options);

// Edit with reference images
const editedImage = await editImageWithReference(
  originalImage,
  referenceImages,
  editPrompt,
  options,
);
```

**After:**

```javascript
// Generate both views with smart selection
const result = await generateDesignWithSmartSelection(designData, options);

// Edit with context awareness
const editResult = await editDesignWithSmartSelection(
  {
    sessionId: result.sessionId,
    originalFrontImage: result.frontImage,
    originalBackImage: result.backImage,
    editPrompt: 'your edit request',
  },
  options,
);
```

## Troubleshooting

### Common Issues

1. **Response API not enabled**: Check `OPENAI_USE_RESPONSES_API=true` in environment
2. **Session deleted**: The system will automatically fall back to traditional method
3. **Timeout errors**: Increase `OPENAI_RESPONSE_TIMEOUT` value
4. **Memory issues**: Reduce `OPENAI_RESPONSE_MAX_LIFETIME` for more frequent cleanup

### Debugging

```javascript
// Check Response API status
const status = getResponseAPIStatus();
console.log('Response API Status:', status);

// Monitor session stats
const stats = getSessionStats();
console.log('Session Stats:', stats);
```

## Best Practices

1. **Always use smart selection functions** for automatic method selection
2. **Store session IDs** for subsequent edits
3. **Handle fallbacks gracefully** - traditional method is always available
4. **Clean up sessions** when design process is complete
5. **Use descriptive edit prompts** - "front only", "back only", "both views"
6. **Test with Response API disabled** to ensure traditional fallback works

## Performance Considerations

- Response API is generally faster for multiple edits
- Traditional method may be better for single edits
- Session management has minimal overhead
- Cleanup runs in background and doesn't block operations

## Security & Privacy

- Sessions are automatically cleaned up
- No persistent storage of conversation data
- All image data is processed through OpenAI's secure API
- Session IDs are not stored permanently
