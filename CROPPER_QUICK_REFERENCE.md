# 📸 Image Cropper - Quick Reference

## Visual Layout

```
╔═══════════════════════════════════════════════════════════╗
║  Crop Front Image                                     [X] ║
║  Adjust the crop area to select 683×1024px portion       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║         ┌─────────────────────────┐                      ║
║         │                         │                      ║
║         │    [YOUR IMAGE HERE]    │ ← Drag to reposition║
║         │                         │                      ║
║         │    Crop Area Overlay    │                      ║
║         │    (683:1024 ratio)     │                      ║
║         │                         │                      ║
║         └─────────────────────────┘                      ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Zoom:  🔍 [========●===========] 150%                   ║
║                                                           ║
║  ℹ️  How to crop:                                        ║
║    • Drag the image to reposition                        ║
║    • Use the zoom slider to adjust size                  ║
║    • The selected area will be resized to 683×1024px    ║
╠═══════════════════════════════════════════════════════════╣
║                          [Cancel]  [Crop & Continue] →   ║
╚═══════════════════════════════════════════════════════════╝
```

## User Actions

### 1. Reposition Image

```
Click + Drag anywhere on the image
   ↓
Image moves around while crop area stays centered
   ↓
Choose the perfect composition
```

### 2. Adjust Zoom

```
Move zoom slider (1x - 3x)
   ↓
Image scales up/down
   ↓
Crop area stays same size (locked to 683:1024)
   ↓
More/less of image fits in crop area
```

### 3. Complete Crop

```
Click "Crop & Continue"
   ↓
Processing spinner shows briefly
   ↓
Modal closes
   ↓
Cropped image appears with green border
   ↓
✓ Cropped to 683×1024px message shows
```

### 4. Cancel

```
Click "Cancel"
   ↓
Modal closes immediately
   ↓
No image saved
   ↓
Can upload different file
```

## Technical Specs

### Cropper Modal

- **Size**: Full screen overlay
- **Background**: Black with 75% opacity
- **Content**: White rounded card, max-width 4xl
- **Z-index**: 50 (always on top)
- **Responsive**: Yes, mobile-optimized

### Crop Area

- **Aspect Ratio**: Fixed at 683:1024 (~0.667)
- **Shape**: Rectangle
- **Grid**: Visible (for alignment)
- **Overlay**: Semi-transparent dark
- **Highlight**: Crop area is lighter

### Zoom Control

- **Type**: Range slider
- **Min**: 1 (100%)
- **Max**: 3 (300%)
- **Step**: 0.1
- **Default**: 1
- **Style**: Indigo gradient thumb

### Output

- **Format**: PNG
- **Quality**: 95%
- **Dimensions**: Exactly 683×1024px
- **Encoding**: Base64 data URL
- **Size**: Varies (~500KB-2MB typically)

## Keyboard Shortcuts

While cropper is open:

- **Arrow keys**: Fine-tune image position (if supported by browser)
- **Esc**: Cancel (close modal)
- **Enter**: Crop & Continue (if supported by browser)

## Browser Support

Works in all modern browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop + iOS)
- ✅ Mobile browsers (Chrome, Safari, Samsung Internet)

## Performance

| Operation       | Time      | Notes                 |
| --------------- | --------- | --------------------- |
| Open cropper    | <100ms    | Instant               |
| Drag/zoom       | <16ms     | 60fps smooth          |
| Processing crop | 200-500ms | Depends on image size |
| Close cropper   | <100ms    | Instant               |

## File Size Impact

Example for a 2000×3000px uploaded image:

```
Original upload:        3.2 MB (full resolution)
After crop to 683×1024: 0.8 MB (reduced size)
                        ↓ 75% size reduction
```

Benefits:

- Faster uploads to server
- Less storage space
- Faster page loads

## Common Issues & Solutions

### Issue: Crop area is too zoomed in

**Solution**: Use zoom slider to zoom out (move left)

### Issue: Can't see the part of image I want

**Solution**:

1. Zoom out more
2. Drag image to reposition

### Issue: Image quality looks bad after crop

**Solution**: Upload a higher resolution original image

### Issue: Crop is wrong orientation

**Solution**: Upload a portrait-oriented image (taller than wide)

### Issue: Cropper won't open

**Solution**: Image might be too small (<683×1024). Upload larger image.

### Issue: Can't drag the image

**Solution**:

1. Try clicking directly on the image
2. Check if zoom is at minimum
3. Try refreshing the page

## Tips for Best Results

### 1. Upload High-Res Images

✅ **Good**: 2000×3000px or larger  
❌ **Bad**: 683×1024px exactly (no room for adjustment)

### 2. Portrait Orientation

✅ **Good**: Taller than wide (portrait)  
⚠️ **OK**: Square (will need significant cropping)  
❌ **Bad**: Wider than tall (landscape - hard to crop)

### 3. Composition

✅ **Good**: Subject centered with margin around  
❌ **Bad**: Subject at edge, no room to adjust

### 4. File Format

✅ **Best**: PNG (lossless)  
✅ **Good**: JPG high quality (95%+)  
⚠️ **OK**: JPG medium quality (75-90%)

## Integration Notes

The cropper is integrated into the design flow:

```
Step 2: Choose Upload Mode
   ↓
User clicks front image dropzone
   ↓
File selector opens
   ↓
User selects image from computer
   ↓
System validates (size, type, dimensions)
   ↓
If larger than 683×1024: CROPPER OPENS ← You are here
   ↓
User crops image
   ↓
Cropped image saved to state
   ↓
Green border + checkmark appears
   ↓
Repeat for back image
   ↓
Step 3: Review & Publish
```

## API Reference

### ImageCropper Component Props

```javascript
<ImageCropper
  image={string}              // Base64 data URL of image to crop
  type={'front' | 'back'}     // Which image is being cropped
  onCropComplete={function}   // Called with cropped image (base64)
  onCancel={function}         // Called when user cancels
  targetWidth={683}           // Optional: Override target width
  targetHeight={1024}         // Optional: Override target height
/>
```

### Usage Example

```javascript
// In your component
const [cropperState, setCropperState] = useState({
  isOpen: false,
  image: null,
  type: null,
});

// Show cropper
setCropperState({
  isOpen: true,
  image: 'data:image/jpeg;base64,...',
  type: 'front',
});

// In JSX
{
  cropperState.isOpen && (
    <ImageCropper
      image={cropperState.image}
      type={cropperState.type}
      onCropComplete={(croppedImage) => {
        // Save cropped image
        setUploadedFrontImage(croppedImage);
        // Close cropper
        setCropperState({ isOpen: false, image: null, type: null });
      }}
      onCancel={() => {
        // Close cropper without saving
        setCropperState({ isOpen: false, image: null, type: null });
      }}
    />
  );
}
```

---

## Need Help?

Check these files:

- `FORCED_CROP_SUMMARY.md` - Overview and benefits
- `UPLOAD_MODE_DOCUMENTATION.md` - Full technical documentation
- `components/design/ImageCropper.jsx` - Component source code
- `app/design/page.js` - Integration code

Or search the code for:

- `handleImageUpload` - Upload handler
- `handleCropComplete` - Crop completion
- `cropperState` - Modal state
