# Image Upload Mode Documentation

## Overview

The design page now supports **two modes** for creating clothing designs:

1. **AI Generation** - Let OpenAI generate designs (costs credits)
2. **Image Upload** - Upload your own front and back images (free!)

## Image Dimension Requirements

### Required Dimensions

Each uploaded image (front and back) should ideally be:

- **683 × 1024 pixels** (portrait orientation)
- **Aspect ratio**: ~0.667 (2:3)

### Supported Formats

- PNG
- JPG/JPEG
- Max file size: 10MB per image

### Manual Cropping (User-Controlled)

The system requires users to manually crop images to exact dimensions:

1. **Perfect Match** (683×1024px)

   - ✓ Image is accepted immediately without cropping
   - Message: `✓ Perfect! 683×1024px`

2. **Larger Images** (anything bigger than 683×1024px)

   - 🎯 **Cropper modal opens automatically**
   - User must manually select the crop area
   - Drag to reposition, zoom to adjust size
   - Real-time preview with grid overlay
   - Must click "Crop & Continue" to proceed
   - Message: `✓ Cropped to 683×1024px`

3. **Too Small Images** (smaller than 683×1024px)
   - ❌ **Rejected with error message**
   - User must upload a larger image
   - Minimum size: 683×1024px

### Client-Side Processing

All image processing happens in the browser:

- **Cropping**: Uses `react-easy-crop` library
- **Canvas rendering**: HTML5 Canvas for final output
- **Base64 encoding**: For storage and display
- **No server uploads**: Everything processed client-side before submission

## User Flow

### Step 1: Basic Details

- User enters item name, type, category, and gender
- Same as before

### Step 2: Choose Creation Method

**Option A: AI Generate (default)**

- Enter design prompt, color, model description
- Select quality level (low/medium/high)
- Costs credits based on quality
- Click "Generate Design" to proceed

**Option B: Upload Images**

- Upload front image (683×1024px recommended)
- Upload back image (683×1024px recommended)
- Enter design description
- No credits required
- Click "Continue with Uploads" to proceed

### Step 3: Review & Publish

- **AI Mode**: See generated images, can edit/inpaint
- **Upload Mode**: See uploaded images, **cannot edit** (editing hidden)
- Select challenges (optional)
- Publish design

## Technical Implementation

### State Variables

```javascript
// Upload mode toggle
const [uploadMode, setUploadMode] = useState(false);

// Uploaded images (base64 data URLs)
const [uploadedFrontImage, setUploadedFrontImage] = useState(null);
const [uploadedBackImage, setUploadedBackImage] = useState(null);

// Validation messages
const [uploadValidationMessages, setUploadValidationMessages] = useState({
  front: '',
  back: '',
});

// Image cropper state
const [cropperState, setCropperState] = useState({
  isOpen: false,
  image: null,
  type: null, // 'front' or 'back'
});
```

### Key Functions

**`handleImageUpload(file, type)`**

- Validates file size (max 10MB)
- Validates file type (must be image)
- Loads image and checks dimensions
- **Rejects images smaller than 683×1024px**
- If exact match (683×1024): accepts immediately
- If larger: opens cropper modal
- Stores as base64 data URL after cropping

**`handleCropComplete(croppedImage)`**

- Called when user finishes cropping
- Stores the cropped image (683×1024px)
- Updates validation message
- Closes cropper modal

**`handleCropCancel()`**

- Called when user cancels cropping
- Closes cropper modal without saving
- User can upload a different image

### ImageCropper Component

**Features:**

- Full-screen modal overlay
- Drag and zoom controls
- Grid overlay for alignment
- Real-time preview
- Aspect ratio locked to 683:1024
- "Crop & Continue" button
- "Cancel" button

**Technology:**

- Built with `react-easy-crop` library
- Canvas-based image processing
- Outputs PNG at 95% quality
- Client-side only (no server)

**`handleSubmit()`**

- In upload mode: validates both images uploaded
- Sets uploaded images as `currentDesign`
- Moves to Step 3
- In AI mode: proceeds with generation as before

### Progress Saving

Upload state is saved to user progress:

```javascript
{
  uploadMode: boolean,
  uploadedFrontImage: string | null,  // base64
  uploadedBackImage: string | null,   // base64
  // ... other fields
}
```

### Conditional Rendering

- **Step 2**: Shows mode toggle + upload UI or AI generation UI
- **Step 3**: Hides "Edit Design" section when `uploadMode === true`
- **Button text**: "Continue with Uploads" vs "Generate Design"
- **Button validation**: Checks both images uploaded in upload mode

## Benefits

### Cost Savings

- No OpenAI API costs for uploads
- Users can generate externally and upload
- Unlimited free submissions via upload

### Flexibility

- Users can use any generation tool they want
- Professional designers can upload their own work
- Mix and match: some AI generated, some uploaded

### Quality Control

- Users have full control over final image quality
- Can iterate externally before uploading
- No generation limits or credit concerns

## Validation Features

### Real-time Feedback

- Dimension validation with helpful messages
- Visual checkmarks on successful upload
- Green borders around uploaded images

### User-Friendly

- Drag and drop support
- Click to upload
- Easy remove button (X in corner)
- File type and size restrictions clearly shown

### Error Handling

- File size exceeded
- Invalid file type
- Failed to load/read image
- Missing required fields

## Future Enhancements

Potential improvements:

1. Batch upload (multiple designs at once)
2. Crop tool for adjusting composition
3. Background removal tool
4. Image filters/adjustments
5. Template downloads (683×1024px guides)
6. Preview before confirming
7. Compression options for large files
8. Support for landscape composite (1536×1024px auto-split)

## Testing Checklist

**Cropping Tests:**

- [ ] Upload correctly sized images (683×1024) - should accept immediately
- [ ] Upload larger images - cropper should open
- [ ] Drag to reposition crop area in cropper
- [ ] Use zoom slider in cropper
- [ ] Click "Crop & Continue" - image should be saved
- [ ] Click "Cancel" in cropper - should close without saving
- [ ] Upload too small images (<683×1024) - should show error

**Upload Flow Tests:**

- [ ] Remove uploaded images and re-upload
- [ ] Toggle between AI and Upload modes
- [ ] Upload front image, then back image
- [ ] Complete upload and see images in Step 3

**Integration Tests:**

- [ ] Save progress in upload mode and reload
- [ ] Publish uploaded design
- [ ] Submit uploaded design to challenges
- [ ] Mix uploaded and AI-generated designs across sessions

**Validation Tests:**

- [ ] Large file size (>10MB) rejection
- [ ] Invalid file type rejection (e.g., .txt file)
- [ ] Attempt to proceed without both images

**UI/UX Tests:**

- [ ] Mobile device cropping experience
- [ ] Tablet cropping experience
- [ ] Desktop cropping experience
- [ ] Validation messages appear correctly
- [ ] Green checkmarks appear after successful upload
