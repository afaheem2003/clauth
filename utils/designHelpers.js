import sharp from 'sharp';
import { createClient } from "@supabase/supabase-js";
import { ANGLES, getAngleImagePath } from '@/utils/imageProcessing';

// Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get approach based on quality level from environment variables
export function getApproachForQuality(quality) {
  const qualityKey = `QUALITY_${quality.toUpperCase()}_APPROACH`;
  const approach = process.env[qualityKey];
  
  console.log(`[Quality Lookup] Checking env var: ${qualityKey} = ${approach}`);
  
  if (!approach) {
    console.warn(`[Quality Lookup] ⚠️ No approach defined for quality: ${quality}, defaulting to PORTRAIT`);
    return 'PORTRAIT';
  }
  
  const normalizedApproach = approach.toUpperCase();
  console.log(`[Quality Lookup] ✅ Quality ${quality} → Approach: ${normalizedApproach}`);
  
  return normalizedApproach;
}

// Helper function to get generation method based on approach
export function getGenerationMethodForApproach(approach) {
  const methods = {
    'PORTRAIT': 'GENERATE_INDIVIDUAL_PORTRAITS',
    'LANDSCAPE': 'GENERATE_COMPOSITE_THEN_SPLIT'
  };
  
  const method = methods[approach];
  if (!method) {
    throw new Error(`Unknown approach: ${approach}. Supported: PORTRAIT, LANDSCAPE`);
  }
  
  console.log(`[Method Lookup] ✅ Approach ${approach} → Method: ${method}`);
  return method;
}

// Helper function to get editing method based on approach
export function getEditingMethodForApproach(approach) {
  const methods = {
    'PORTRAIT': 'EDIT_INDIVIDUAL_PORTRAITS',
    'LANDSCAPE': 'EDIT_LANDSCAPE_COMPOSITE'
  };
  
  const method = methods[approach];
  if (!method) {
    throw new Error(`Unknown approach: ${approach}. Supported: PORTRAIT, LANDSCAPE`);
  }
  
  console.log(`[Editing Method] Approach ${approach} → Method: ${method}`);
  return method;
}

/**
 * Splits a landscape image into two vertical panels (front and back views)
 * For landscape generations, crops panels to match portrait aspect ratio
 */
export async function splitCompositeImage(imageBuffer) {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Validate image dimensions
    if (metadata.width !== 1536 || metadata.height !== 1024) {
      console.warn(`[Image Split] Expected 1536x1024 image, got ${metadata.width}x${metadata.height}`);
      // Resize to expected dimensions if needed
      imageBuffer = await sharp(imageBuffer)
        .resize(1536, 1024, { fit: 'fill' })
        .toBuffer();
      metadata.width = 1536;
      metadata.height = 1024;
    }
    
    // Calculate dimensions for aspect ratio matching
    // Portrait images are 1024x1536 (aspect ratio: 1024/1536 = 0.6667)
    // For 1024 height, width should be: 1024 * (1024/1536) = 682.67px
    // Round to 683px for clean dimensions
    const targetPanelWidth = 683;
    const targetPanelHeight = 1024;
    
    // For a 1536x1024 image, each half is 768px wide
    // We need to crop from 768px to 683px, so remove 85px total (42.5px from each side)
    const originalPanelWidth = Math.floor(metadata.width / 2); // 768px
    const cropAmount = originalPanelWidth - targetPanelWidth; // 85px
    const cropFromEachSide = Math.floor(cropAmount / 2); // 42px from each side
    
    console.log(`[Image Split] Cropping landscape panels:`);
    console.log(`[Image Split]   Original panel size: ${originalPanelWidth}x${metadata.height}`);
    console.log(`[Image Split]   Target panel size: ${targetPanelWidth}x${targetPanelHeight}`);
    console.log(`[Image Split]   Crop amount: ${cropAmount}px (${cropFromEachSide}px from each side)`);
    
    const trimPixels = 2; // Pixels to trim from center seam where panels meet
    
    // Calculate starting positions with crop and trim offsets
    const positions = [
      { 
        left: cropFromEachSide, 
        width: targetPanelWidth, 
        name: 'front',
        description: `Front panel: crop ${cropFromEachSide}px from left edge`
      },
      { 
        left: metadata.width/2 + trimPixels + cropFromEachSide, 
        width: targetPanelWidth, 
        name: 'back',
        description: `Back panel: start at center + ${trimPixels + cropFromEachSide}px`
      }
    ];

    // Extract each panel with cropping
    const extractPanel = async (left, width, name, description) => {
      console.log(`[Image Split] Extracting ${name} panel: ${description}`);
      console.log(`[Image Split]   Extract region: left=${left}, width=${width}, height=${targetPanelHeight}`);
      
      const panel = await sharp(imageBuffer)
        .extract({
          left: Math.max(0, left),
          top: 0,
          width: Math.min(width, metadata.width - left),
          height: targetPanelHeight
        })
        .resize(targetPanelWidth, targetPanelHeight, { // Ensure exact dimensions
          fit: 'fill',
          position: 'center'
        })
        .toBuffer();
      
      // Validate panel dimensions
      const panelMetadata = await sharp(panel).metadata();
      console.log(`[Image Split]   Final ${name} panel: ${panelMetadata.width}x${panelMetadata.height}`);
      
      if (panelMetadata.width !== targetPanelWidth || panelMetadata.height !== targetPanelHeight) {
        throw new Error(`Invalid ${name} panel dimensions: ${panelMetadata.width}x${panelMetadata.height}, expected ${targetPanelWidth}x${targetPanelHeight}`);
      }
      
      return panel;
    };

    // Extract both panels in parallel
    const panels = await Promise.all(
      positions.map(pos => extractPanel(pos.left, pos.width, pos.name, pos.description))
    );

    console.log(`[Image Split] Successfully split and cropped landscape image into ${targetPanelWidth}x${targetPanelHeight} panels`);
    return {
      [ANGLES.FRONT]: panels[0],
      [ANGLES.BACK]: panels[1]
    };
  } catch (error) {
    console.error('Error splitting landscape image:', error);
    throw new Error(`Failed to split landscape image into panels: ${error.message}`);
  }
}

/**
 * Uploads split image panels to Supabase and returns their public URLs
 */
export async function uploadPanelsToStorage(angleBuffers, userId) {
  const tempItemId = `temp_${Date.now()}`;
  const angleUrls = {};
  
  await Promise.all(Object.entries(angleBuffers).map(async ([angle, buffer]) => {
    const filePath = getAngleImagePath(userId, tempItemId, angle);
    
    const { error } = await supabase.storage
      .from('clothingitemimages')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('clothingitemimages')
      .getPublicUrl(filePath);

    angleUrls[angle] = publicUrl;
  }));

  return angleUrls;
}

/**
 * Creates portrait panels from front and back portrait images
 * Resizes to match the same dimensions as landscape-split panels
 */
export async function createPortraitPanels(frontImageBuffer, backImageBuffer) {
  try {
    // Use the same target dimensions as landscape splitting for consistency
    // This ensures both generation methods produce the same final panel sizes
    const targetPanelWidth = 683;  // Matches landscape split dimensions
    const targetPanelHeight = 1024;
    
    console.log(`[Portrait Panels] Resizing portrait images to ${targetPanelWidth}x${targetPanelHeight}`);
    
    // Resize both images to ensure consistent dimensions
    const frontPanel = await sharp(frontImageBuffer)
      .resize(targetPanelWidth, targetPanelHeight, { 
        fit: 'fill',
        position: 'center'
      })
      .toBuffer();

    const backPanel = await sharp(backImageBuffer)
      .resize(targetPanelWidth, targetPanelHeight, { 
        fit: 'fill',
        position: 'center'
      })
      .toBuffer();

    // Validate panel dimensions
    const frontMetadata = await sharp(frontPanel).metadata();
    const backMetadata = await sharp(backPanel).metadata();
    
    console.log(`[Portrait Panels] Front panel: ${frontMetadata.width}x${frontMetadata.height}`);
    console.log(`[Portrait Panels] Back panel: ${backMetadata.width}x${backMetadata.height}`);
    
    if (frontMetadata.width !== targetPanelWidth || frontMetadata.height !== targetPanelHeight) {
      throw new Error(`Invalid front panel dimensions: ${frontMetadata.width}x${frontMetadata.height}, expected ${targetPanelWidth}x${targetPanelHeight}`);
    }
    
    if (backMetadata.width !== targetPanelWidth || backMetadata.height !== targetPanelHeight) {
      throw new Error(`Invalid back panel dimensions: ${backMetadata.width}x${backMetadata.height}, expected ${targetPanelWidth}x${targetPanelHeight}`);
    }

    console.log(`[Portrait Panels] Successfully created ${targetPanelWidth}x${targetPanelHeight} portrait panels`);
    return {
      [ANGLES.FRONT]: frontPanel,
      [ANGLES.BACK]: backPanel
    };
  } catch (error) {
    console.error('Error creating portrait panels:', error);
    throw new Error(`Failed to create portrait panels: ${error.message}`);
  }
} 

// Helper function to determine if we need cross-quality conversion
function needsConversion(sourceApproach, targetApproach) {
  return sourceApproach !== targetApproach;
}

// Helper function to detect current image format
function detectCurrentFormat(originalImage, frontImage, backImage) {
  if (originalImage && !frontImage && !backImage) {
    return 'LANDSCAPE';
  } else if (!originalImage && frontImage && backImage) {
    return 'PORTRAIT';
  } else {
    throw new Error('Ambiguous image format - provide either composite OR front+back images');
  }
}

 