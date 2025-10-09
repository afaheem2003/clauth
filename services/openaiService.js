// services/openaiService.js

import OpenAI from 'openai';
import clothingPromptSchema from '../schemas/clothingPromptSchema.js';
import { ITEM_TYPES } from '@/app/constants/options';
import { Readable } from 'stream';
import sharp from 'sharp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env file
});

// Helper function to convert buffer to stream for OpenAI API
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function getAIDesignerInsights(structuredPrompt) {
  if (!structuredPrompt || typeof structuredPrompt !== 'object') {
    throw new Error('Structured prompt must be an object with required fields.');
  }

  const { itemDescription, frontDesign, backDesign, modelDetails, gender = 'UNISEX' } = structuredPrompt;

  if (!itemDescription || !frontDesign || !backDesign || !modelDetails) {
    throw new Error('All prompt fields (itemDescription, frontDesign, backDesign, modelDetails) are required.');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured.");
  }

  let promptJsonData;

  // Get Structured Item Details
  try {
    console.log("[AI Insights] Getting structured item details...");
    const itemDetailsMessages = [
      {
        role: "system",
        content: `You are an AI fashion designer and prompt architect. Your task is to create clear, precise, and image-generation-friendly descriptions of clothing items.

IMPORTANT GUIDELINES:
1. Focus on CONCRETE VISUAL ELEMENTS only - what can be seen in a photograph
2. Describe exact placement of designs (e.g., "centered on chest", "top right shoulder", "lower back")
3. Avoid subjective descriptions like "whimsical", "beautiful", "elegant"
4. Keep descriptions concise and focused on physical appearance
5. For front/back details, describe ONLY what appears on that side
6. Use consistent terminology between front and back views
7. Specify sizes of elements where relevant (e.g., "large 6-inch sunflower", "small 2-inch logo")

MODEL DESCRIPTION GUIDELINES:
- Consider the target gender (${gender}) when generating model descriptions
- If modelDetails contains "Generate appropriate model description", create a professional model description that complements the clothing style and target gender
- If modelDetails contains a user description, enhance and refine it for image generation
- Focus on professional modeling appearance, pose, and styling that suits the garment and target audience

Your response must include:
1. A clear, factual description
2. Precise front view details
3. Precise back view details
4. Professional model details for image generation (considering target gender: ${gender})

🚫 NO subjective descriptions, artistic interpretations, or non-visual elements.`
      },
      {
        role: "user",
        content: `Design Details:
Main Item: ${itemDescription}
Target Gender: ${gender}
Front Design: ${frontDesign}
Back Design: ${backDesign}
Model: ${modelDetails}

Generate a structured response focusing on CONCRETE, VISIBLE elements only. Consider the target gender when describing the model and styling.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: itemDetailsMessages,
      functions: [{
        name: "generateClothingItemDetails",
        description: "Generates structured details for a clothing item",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Clear, factual description focusing on visible elements" },
            frontDetails: { type: "string", description: "Precise description of front design elements and their placement" },
            backDetails: { type: "string", description: "Precise description of back design elements and their placement" },
            modelDetails: { type: "string", description: "Professional model description for image generation, including appearance, pose, and styling" }
          },
          required: ["description", "frontDetails", "backDetails", "modelDetails"]
        }
      }],
      function_call: { name: "generateClothingItemDetails" }
    });

    const itemMessage = response.choices[0].message;
    if (itemMessage.function_call && itemMessage.function_call.arguments) {
      try {
        // Clean the JSON string to handle control characters
        let jsonString = itemMessage.function_call.arguments;
        
        // Log the raw response for debugging
        console.log("[AI Insights] Raw JSON string length:", jsonString.length);
        console.log("[AI Insights] Raw JSON preview:", jsonString.substring(0, 200));
        
        // Clean control characters that can break JSON parsing
        jsonString = jsonString
          .replace(/\n/g, '\\n')     // Escape newlines
          .replace(/\r/g, '\\r')     // Escape carriage returns
          .replace(/\t/g, '\\t')     // Escape tabs
          .replace(/\f/g, '\\f')     // Escape form feeds
          .replace(/\v/g, '\\v')     // Escape vertical tabs
          .replace(/\0/g, '\\0');    // Escape null characters
        
        console.log("[AI Insights] Cleaned JSON string length:", jsonString.length);
        
        promptJsonData = JSON.parse(jsonString);
        console.log("[AI Insights] Successfully obtained promptJsonData:", promptJsonData);
      } catch (parseError) {
        console.error("[AI Insights] JSON parse error:", parseError);
        console.error("[AI Insights] Failed JSON string:", itemMessage.function_call.arguments);
        
        // Try a more aggressive cleaning approach
        try {
          console.log("[AI Insights] Attempting aggressive JSON cleaning...");
          let cleanedJson = itemMessage.function_call.arguments
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove all control characters
            .replace(/\\/g, '\\\\')          // Escape backslashes
            .replace(/"/g, '\\"')            // Escape quotes
            .replace(/\\\\/g, '\\')          // Fix double escaping
            .replace(/\\"/g, '"');           // Fix quote escaping
          
          // Try to extract JSON manually if it's wrapped in extra text
          const jsonMatch = cleanedJson.match(/\{.*\}/s);
          if (jsonMatch) {
            cleanedJson = jsonMatch[0];
          }
          
          promptJsonData = JSON.parse(cleanedJson);
          console.log("[AI Insights] Successfully parsed with aggressive cleaning");
        } catch (fallbackError) {
          console.error("[AI Insights] Aggressive cleaning also failed:", fallbackError);
          
          // Final fallback - create default response
          console.log("[AI Insights] Using fallback default response");
          promptJsonData = {
            description: "Professional clothing design with enhanced details",
            frontDetails: "Enhanced front design with improved visual elements",
            backDetails: "Enhanced back design with improved visual elements",
            modelDetails: "Professional runway model with elegant pose and styling"
          };
        }
      }
    } else {
      console.error("[AI Insights] Failed: OpenAI response did not include expected function call for item details.", response);
      throw new Error("AI did not return structured item details.");
    }
  } catch (error) {
    console.error("[AI Insights] Error: Failed to get structured item details from OpenAI:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (Item Details): ${error.status} ${error.name} - ${error.message}`);
    }
    throw error;
  }

  return { promptJsonData };
} 

export async function generateLandscapeImageWithOpenAI(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  try {
    console.log("[OpenAI Service] Generating initial image with options:", options);
    
    // Default options
    const {
      model = "gpt-image-1",
      size = "1536x1024",
      quality = process.env.OPENAI_IMAGE_QUALITY || "high",
      itemDescription = '',
      frontDesign = '',
      backDesign = '',
      modelDetails = '',
      gender = 'UNISEX'
    } = options;

    // Map internal quality levels to OpenAI quality values
    // Use quality parameter directly


    const basePrompt = `
Generate a high-resolution horizontal (landscape) image, sized exactly 1536x1024 pixels, showing two views of the same model and clothing item positioned side by side.

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

CRITICAL LAYOUT REQUIREMENTS:
- NO dividers, borders, lines, or separators between the left and right areas
- The background must flow seamlessly across the entire width of the image
- Think of this as ONE continuous studio space photographed from two angles, not two separate panels
- The lighting and studio environment should be consistent and uninterrupted across the full image width

FASHION EDITORIAL STYLE REQUIREMENTS:
- FULL-BODY shots showing the complete model from head to toe in both panels
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a LOWER ANGLE (slightly below eye level) to create a more flattering, elongated silhouette
- Camera positioned at APPROPRIATE DISTANCE with generous spacing - ensure significant space between the top of the image and the model's head, and between the bottom of the image and the model's feet
- The model should appear tall and elegant with proper proportions
- Avoid close-up or cropped shots - show the complete figure and styling with ample breathing room
- Professional fashion photography composition and lighting

Both areas must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent studio lighting with a clean, neutral background that extends seamlessly across the entire image width.

IMPORTANT BRAND SAFETY NOTE:
Do **not** use or reference any real-world brand names, logos, university names, slogans, or trademarks (e.g., "Nike", "Harvard", "Burberry", "Fighting Irish"). Every design element, label, or text must be **original** and fictional. Use made-up names, slogans, or symbols that are safe for commercial use.

Left Area (Front View):
Display the model facing directly forward in a full-body pose, showcasing the complete front view of a ${itemDescription}.
The front design should include: ${frontDesign}

Right Area (Back View):
Display the same model facing directly backward in a full-body pose, showcasing the complete back view of the same ${itemDescription}.
The back design should include: ${backDesign}

Model Appearance:
The same model must appear in both areas. Appearance details: ${modelDetails}

Target Gender: ${gender}

Image Requirements:
- ONE continuous studio background that flows seamlessly across the entire 1536x1024 image
- NO visual separators, dividers, lines, or borders anywhere in the image
- Use identical studio conditions across both areas (lighting, pose style, camera distance, proportions)
- Match professional fashion magazine editorial photography standards
- FULL-BODY composition showing complete model from head to toe with generous spacing around the figure
- Camera angle slightly below eye level to create an elongated, flattering silhouette
- Ensure ample space at top and bottom of frame - model should not fill the entire vertical space
- PHOTOREALISTIC rendering of all elements - fabric textures, lighting, shadows, and human features
- The clothing should be faithfully rendered from both sides with realistic material properties
- Text or lettering printed on the clothing (e.g., logos, mottos, crests) is welcome and encouraged if described, but must be fictional and **not** resemble any existing brands or slogans
- Do **not** include any unrelated UI text, captions, labels, borders, watermarks, shadows, or props
- The background must be a single, continuous, clean neutral surface with no interruptions

Final Output:
A clean, high-quality, PHOTOREALISTIC full-body comparison of the same item viewed from front and back, appearing as if photographed for a fashion magazine editorial in one continuous studio space with no visual dividers or separations. The model should appear tall and elegant with proper spacing around the figure.
`.trim();

    const requestOptions = {
      model,
      prompt: basePrompt,
      n: 1,
      size,
      quality: quality
    };

    console.log("[OpenAI Service] Using standard generation mode");
    const response = await openai.images.generate(requestOptions);

    if (!response.data || !response.data[0]) {
      throw new Error("No valid response from image generation");
    }

    const imageData = response.data[0];
    return imageData.b64_json;

  } catch (error) {
    console.error("[OpenAI Service] Error generating image:", error);
    if (error instanceof OpenAI.APIError) {
      // Handle specific OpenAI error types with user-friendly messages
      if (error.status === 400) {
        if (error.message?.includes('safety system') || error.message?.includes('content that is not allowed')) {
          throw new Error("Your design description was flagged by our content safety system. Please try with a simpler description, avoid brand names, and use more general clothing terms.");
        } else if (error.message?.includes('invalid') || error.message?.includes('format')) {
          throw new Error("There was an issue with your design request format. Please try with a simpler description.");
        } else {
          throw new Error("Your design request couldn't be processed. Please try with a simpler description or different wording.");
        }
      } else if (error.status === 429) {
        throw new Error("Our AI service is busy right now. Please wait a moment and try again.");
      } else if (error.status >= 500) {
        throw new Error("Our AI service is temporarily unavailable. Please try again in a few minutes.");
      } else {
        throw new Error(`AI service error: ${error.message || 'Please try again with a different description.'}`);
      }
    }
    throw new Error(`Failed to generate design: ${error.message || 'Please try with a simpler description or try again later.'}`);
  }
}

export async function getAIInpaintingInsights(inpaintingPrompt, originalItemType, originalColor, originalDescription = null) {
  if (!inpaintingPrompt || typeof inpaintingPrompt !== 'string') {
    throw new Error('Inpainting prompt must be a non-empty string.');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured.");
  }

  try {
    console.log("[AI Inpainting Insights] Processing inpainting prompt...");
    
    const inpaintingMessages = [
      {
        role: "system",
        content: `You are an AI fashion designer specializing in precise clothing modifications and image improvements. Your task is to parse user edit requests and create structured inpainting instructions.

CRITICAL GUIDELINES:
1. Handle TWO types of requests:
   a) CLOTHING modifications (change colors, patterns, designs, garment structure)
   b) MODEL/OVERALL improvements (make more realistic, change model appearance, improve lighting/quality)
2. For CLOTHING changes: Apply to the garment while preserving model and environment
3. For MODEL/OVERALL changes: Apply to the entire image including model, pose, and overall quality
4. If request mentions both clothing AND model changes, apply both appropriately
5. Maintain the same ${originalItemType} base garment type unless explicitly changing it
6. Focus on CONCRETE, VISUAL modifications only
7. IMPORTANT: If the user specifies "front", "back", or a specific location, apply changes ONLY to that view
8. If no specific location is mentioned, determine the most logical placement

PARSING RULES:
- "add X to the back" → frontModifications: "No changes to front view.", backModifications: "Add X to the back"
- "add X to the front" → frontModifications: "Add X to the front", backModifications: "No changes to back view."
- "change color to Y" → Apply to both front and back
- "make more realistic" → Apply to both front and back

Your response must include:
1. Clear front view modifications (what changes on the front view)
2. Clear back view modifications (what changes on the back view)  
3. A preservation note about what to maintain vs what to change
4. Summary of the overall modification being applied
5. Complete updated design description showing the final design after all changes

🔧 CLOTHING CHANGES: Modify garment while keeping model/environment the same
🎨 MODEL/OVERALL CHANGES: Improve model appearance, realism, pose, or overall image quality`
      },
      {
        role: "user",
        content: `Original item: ${originalItemType} in ${originalColor}
${originalDescription ? `Original design description: "${originalDescription}"` : ''}

User's edit request: "${inpaintingPrompt}"

Parse this into structured front and back modifications. Determine if this is:
- A CLOTHING modification (change the garment itself)
- A MODEL/OVERALL modification (improve model appearance, realism, lighting, etc.)
- Both types of changes

Apply the changes to the most logical location(s) for each view.

IMPORTANT: For the updated design description, write a clean, concise fashion editorial description of the final garment as it would appear on a fashion website. Focus ONLY on the physical features, materials, colors, and design elements that ARE CURRENTLY VISIBLE on the garment. 

CRITICAL: Do NOT mention:
- The editing process or any changes made
- What was removed, added, or modified
- Comparisons to previous versions
- Quality improvements or technical changes
- Phrases like "despite the removal", "after editing", "now features", etc.

Write as if this is the original, unchanged design being described for the first time in a fashion catalog. Only describe what someone would actually see when looking at the garment.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: inpaintingMessages,
      functions: [{
        name: "generateInpaintingInstructions",
        description: "Generates structured inpainting instructions for clothing modifications and model appearance improvements",
        parameters: {
          type: "object",
          properties: {
            frontModifications: { 
              type: "string", 
              description: "Precise description of changes to make on the front view (clothing changes, model improvements, or both). If no front changes, say 'No changes to front view.'" 
            },
            backModifications: { 
              type: "string", 
              description: "Precise description of changes to make on the back view (clothing changes, model improvements, or both). If no back changes, say 'No changes to back view.'" 
            },
            preservationNote: { 
              type: "string", 
              description: "Instructions on what to preserve vs what to change (depends on whether it's clothing-only or model/overall improvements)" 
            },
            modificationSummary: { 
              type: "string", 
              description: "Brief summary of the overall change being made (clothing modification, model improvement, or both)" 
            },
            updatedDesignDescription: {
              type: "string",
              description: "Clean, concise fashion editorial description of the final garment as it currently exists. Describe ONLY what is visible on the garment right now. Do NOT mention any editing process, what was removed/added/changed, or use phrases like 'despite the removal' or 'now features'. Write as if this is the original design being described for the first time in a fashion catalog."
            }
          },
          required: ["frontModifications", "backModifications", "preservationNote", "modificationSummary", "updatedDesignDescription"]
        }
      }],
      function_call: { name: "generateInpaintingInstructions" }
    });

    const inpaintingMessage = response.choices[0].message;
    if (inpaintingMessage.function_call && inpaintingMessage.function_call.arguments) {
      try {
        // Clean the JSON string to handle control characters
        let jsonString = inpaintingMessage.function_call.arguments;
        
        // Log the raw response for debugging
        console.log("[AI Inpainting Insights] Raw JSON string length:", jsonString.length);
        console.log("[AI Inpainting Insights] Raw JSON preview:", jsonString.substring(0, 200));
        
        // Clean control characters that can break JSON parsing
        jsonString = jsonString
          .replace(/\n/g, '\\n')     // Escape newlines
          .replace(/\r/g, '\\r')     // Escape carriage returns
          .replace(/\t/g, '\\t')     // Escape tabs
          .replace(/\f/g, '\\f')     // Escape form feeds
          .replace(/\v/g, '\\v')     // Escape vertical tabs
          .replace(/\0/g, '\\0');    // Escape null characters
        
        console.log("[AI Inpainting Insights] Cleaned JSON string length:", jsonString.length);
        
        const inpaintingData = JSON.parse(jsonString);
        console.log("[AI Inpainting Insights] Successfully obtained inpainting instructions:", inpaintingData);
        return { inpaintingData };
      } catch (parseError) {
        console.error("[AI Inpainting Insights] JSON parse error:", parseError);
        console.error("[AI Inpainting Insights] Failed JSON string:", inpaintingMessage.function_call.arguments);
        
        // Try a more aggressive cleaning approach
        try {
          console.log("[AI Inpainting Insights] Attempting aggressive JSON cleaning...");
          let cleanedJson = inpaintingMessage.function_call.arguments
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove all control characters
            .replace(/\\/g, '\\\\')          // Escape backslashes
            .replace(/"/g, '\\"')            // Escape quotes
            .replace(/\\\\/g, '\\')          // Fix double escaping
            .replace(/\\"/g, '"');           // Fix quote escaping
          
          // Try to extract JSON manually if it's wrapped in extra text
          const jsonMatch = cleanedJson.match(/\{.*\}/s);
          if (jsonMatch) {
            cleanedJson = jsonMatch[0];
          }
          
          const fallbackData = JSON.parse(cleanedJson);
          console.log("[AI Inpainting Insights] Successfully parsed with aggressive cleaning");
          return { inpaintingData: fallbackData };
        } catch (fallbackError) {
          console.error("[AI Inpainting Insights] Aggressive cleaning also failed:", fallbackError);
          
          // Final fallback - create default response
          console.log("[AI Inpainting Insights] Using fallback default response");
          return {
            inpaintingData: {
              frontModifications: "Enhance the front design as requested.",
              backModifications: "Enhance the back design as requested.",
              preservationNote: "Preserve the overall design while making the requested improvements.",
              modificationSummary: "Design enhancement as requested.",
              updatedDesignDescription: "Enhanced clothing design with improved details."
            }
          };
        }
      }
    } else {
      console.error("[AI Inpainting Insights] Failed: OpenAI response did not include expected function call for inpainting instructions.", response);
      throw new Error("AI did not return structured inpainting instructions.");
    }
  } catch (error) {
    console.error("[AI Inpainting Insights] Error: Failed to get structured inpainting instructions from OpenAI:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (Inpainting Insights): ${error.status} ${error.name} - ${error.message}`);
    }
    throw error;
  }
} 

export async function generatePortraitWithOpenAI(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OpenAI Service] Generating portrait image (attempt ${attempt}/${maxRetries}) with options:`, options);
      
      // Default options
      const {
        model = "gpt-image-1",
        size = "1024x1536",
        quality = process.env.OPENAI_IMAGE_QUALITY || "high",
        itemDescription = '',
        frontDesign = '',
        backDesign = '',
        modelDetails = '',
        gender = 'UNISEX',
        referenceImage = null
      } = options;

      // Determine if this is a front or back view generation
      const isBackView = backDesign && !frontDesign;
      const designDetails = isBackView ? backDesign : frontDesign;
      const viewType = isBackView ? 'back' : 'front';

      // Map internal quality levels to OpenAI quality values
      // Use quality parameter directly

      const portraitPrompt = `
Generate a high-resolution vertical (portrait) image, sized exactly 1024x1536 pixels, showing a single model wearing a clothing item from the ${viewType} view.

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

${referenceImage ? `
CRITICAL CONSISTENCY REQUIREMENTS:
- Use the provided reference image to maintain EXACT consistency in model appearance, styling, and overall aesthetic
- The model must appear identical to the reference image (same face, hair, pose style, outfit details)
- Match the lighting, background, and professional photography style of the reference
- Ensure the same model proportions, skin tone, and styling details
- The only difference should be the viewing angle (${viewType} view instead of front view)
- Maintain the same outfit styling (pants, shoes, accessories, etc.) as shown in the reference
` : ''}

LAYOUT REQUIREMENTS:
- Single ${viewType}-facing view only
- Clean, professional studio background
- Model positioned centrally in the frame
- Professional fashion magazine editorial photography style

FASHION EDITORIAL STYLE REQUIREMENTS:
- FULL-BODY shot showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a LOWER ANGLE (slightly below eye level) to create a more flattering, elongated silhouette
- Camera positioned at APPROPRIATE DISTANCE with generous spacing - ensure significant space between the top of the image and the model's head, and between the bottom of the image and the model's feet
- The model should appear tall and elegant with proper proportions
- Avoid close-up or cropped shots - show the complete figure and styling with ample breathing room
- Professional fashion photography composition and lighting

The image should feature a hyperrealistic runway model wearing the clothing item described below, photographed under professional studio lighting with a clean, neutral background.

IMPORTANT BRAND SAFETY NOTE:
Do **not** use or reference any real-world brand names, logos, university names, slogans, or trademarks (e.g., "Nike", "Harvard", "Burberry", "Fighting Irish"). Every design element, label, or text must be **original** and fictional. Use made-up names, slogans, or symbols that are safe for commercial use.

Model View (${viewType.charAt(0).toUpperCase() + viewType.slice(1)}):
${isBackView 
  ? `Display the model facing AWAY from the camera, showing their back/rear view in a full-body pose, showcasing the complete back view of a ${itemDescription}.`
  : `Display the model facing directly forward in a full-body pose, showcasing the complete front view of a ${itemDescription}.`
}
The ${viewType} design should include: ${designDetails}

Target Gender: ${gender}

Model Appearance:
${modelDetails}

Image Requirements:
- Professional studio lighting and background
- FULL-BODY composition showing complete model from head to toe with generous spacing around the figure
- Camera angle slightly below eye level to create an elongated, flattering silhouette
- Ensure ample space at top and bottom of frame - model should not fill the entire vertical space
- PHOTOREALISTIC rendering of all elements - fabric textures, lighting, shadows, and human features
- Model should be well-positioned and proportioned for fashion editorial style
- Clothing should be clearly visible and well-rendered with realistic material properties
- Text or lettering on clothing must be fictional/original
- No unrelated UI elements, watermarks, or distractions
- Clean, neutral background suitable for commercial use
- Fashion magazine editorial photography standards
${isBackView ? '- Model must be facing AWAY from camera to show the back view of the clothing' : '- Model facing towards camera to show the front view of the clothing'}
${referenceImage ? '- Match the model appearance, styling, and overall aesthetic from the reference image exactly' : ''}

Final Output:
A clean, high-quality, PHOTOREALISTIC full-body portrait image showing the clothing item from the ${viewType} view only, shot in fashion magazine editorial style. The model should appear tall and elegant with proper spacing around the figure.${referenceImage ? ' The image must maintain perfect consistency with the provided reference image.' : ''}
`.trim();

      const requestOptions = {
        model,
        prompt: portraitPrompt,
        n: 1,
        size,
        quality: quality
      };

      // If we have a reference image (for back view generation), include it
      if (referenceImage) {
        console.log("[OpenAI Service] Using reference image for consistency");
        // Convert base64 to buffer for OpenAI API
        const referenceBuffer = Buffer.from(referenceImage, 'base64');
        requestOptions.image = new File([referenceBuffer], 'reference.png', { type: 'image/png' });
      }

      console.log("[OpenAI Service] Using portrait generation mode");
      
      // Create timeout promise - increased from 3 to 5 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Portrait generation request timed out after 5 minutes')), 300000);
      });

      const response = await Promise.race([
        referenceImage 
          ? openai.images.edit(requestOptions) // Use edit mode when we have a reference
          : openai.images.generate(requestOptions), // Use generate mode for front view
        timeoutPromise
      ]);

      if (!response.data || !response.data[0]) {
        throw new Error("No valid response from portrait image generation");
      }

      const imageData = response.data[0];
      console.log("[OpenAI Service] Successfully generated portrait image");
      return imageData.b64_json;

    } catch (error) {
      lastError = error;
      console.error(`[OpenAI Service] Portrait generation attempt ${attempt} failed:`, error.message);
      
      // Check if it's a connection error that might be retryable
      const isRetryableError = (
        error.message.includes('Connection error') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('fetch failed') ||
        (error.status >= 500 && error.status < 600) // Server errors
      );

      if (isRetryableError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[OpenAI Service] Retrying portrait generation in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If it's not retryable or we've exhausted retries, throw the error
      break;
    }
  }

  // If we get here, all retries failed
  console.error("[OpenAI Service] All portrait generation attempts failed. Final error:", lastError);
  if (lastError instanceof OpenAI.APIError) {
    // Handle specific OpenAI error types with user-friendly messages
    if (lastError.status === 400) {
      if (lastError.message?.includes('safety system') || lastError.message?.includes('content that is not allowed')) {
        throw new Error("Your design description was flagged by our content safety system. Please try with a simpler description, avoid brand names, and use more general clothing terms.");
      } else if (lastError.message?.includes('invalid') || lastError.message?.includes('format')) {
        throw new Error("There was an issue with your design request format. Please try with a simpler description.");
      } else {
        throw new Error("Your design request couldn't be processed. Please try with a simpler description or different wording.");
      }
    } else if (lastError.status === 429) {
      throw new Error("Our AI service is busy right now. Please wait a moment and try again.");
    } else if (lastError.status >= 500) {
      throw new Error("Our AI service is temporarily unavailable. Please try again in a few minutes.");
    } else {
      throw new Error(`AI service error: ${lastError.message || 'Please try again with a different description.'}`);
    }
  }
  throw new Error(`Failed to generate design after ${maxRetries} attempts: ${lastError.message || 'Please try with a simpler description or try again later.'}`);
}

export async function editImageWithReference(originalImage, referenceImages, editPrompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  if (!originalImage) {
    throw new Error("Original image is required for reference-based editing.");
  }

  if (!referenceImages || referenceImages.length === 0) {
    throw new Error("At least one reference image is required for reference-based editing.");
  }

  if (!editPrompt) {
    throw new Error("Edit prompt is required for reference-based editing.");
  }

  try {
    console.log("[OpenAI Service] Editing image with reference images:", referenceImages.length);
    
    // Default options
    const {
      model = "gpt-image-1",
      size = "1536x1024",
      quality = process.env.OPENAI_IMAGE_QUALITY || "high",
      originalItemType = '',
      originalColor = '',
      view = '' // 'front' or 'back' (optional, for prompt logic)
    } = options;

    // Convert base64 strings to buffers
    const imageBuffer = Buffer.from(originalImage, 'base64');
    const referenceBuffers = referenceImages.map(img => Buffer.from(img, 'base64'));

    console.log("[OpenAI Service] Making reference-based edit request to OpenAI...");
    console.log("[OpenAI Service] Edit prompt:", editPrompt);
    
    // Enhance the prompt to emphasize reference usage
    const enhancedEditPrompt = `
${editPrompt}

Please use the provided reference images to maintain design consistency:
- Use the first reference image as your main design guide
- Match the colors, patterns, textures, and design elements from the reference images
- Keep the same garment style and aesthetic 
- Apply only the specific modifications requested above
- Preserve all other design elements from the reference images

Please ensure the edited result maintains the same aesthetic and design elements as shown in the reference images.
    `.trim();

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Reference-based editing request timed out after 2 minutes')), 120000);
    });

    // Prepare image array - original image first, then reference images
    let imageArray = [new File([imageBuffer], 'original.png', { type: 'image/png' })];
    
    // Add reference images
    console.log(`[OpenAI Service] Adding ${referenceBuffers.length} reference image(s) for style consistency`);
    referenceBuffers.forEach((buf, idx) => {
      imageArray.push(new File([buf], `reference${idx + 1}.png`, { type: 'image/png' }));
    });

    console.log(`[OpenAI Service] Sending ${imageArray.length} image(s) to OpenAI (original + references)`);

    // Make the API call with reference images - NO MASK NEEDED
    const response = await Promise.race([
      openai.images.edit({
        model,
        prompt: enhancedEditPrompt,
        image: imageArray,
        // NO MASK - pure reference-based editing
        n: 1,
        size,
        quality: quality
      }),
      timeoutPromise
    ]);

    console.log("[OpenAI Service] Received response from OpenAI reference-based editing");

    if (!response.data || !response.data[0]) {
      throw new Error("No valid response from reference-based editing");
    }

    const imageData = response.data[0];
    console.log("[OpenAI Service] Successfully completed reference-based editing");
    return imageData.b64_json;

  } catch (error) {
    console.error("[OpenAI Service] Error during reference-based editing:", error);
    console.error("[OpenAI Service] Error details:", {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    if (error instanceof OpenAI.APIError) {
      console.error("[OpenAI Service] Full OpenAI error:", JSON.stringify(error, null, 2));
      
      // Handle specific OpenAI error types with user-friendly messages
      if (error.status === 400) {
        if (error.message?.includes('safety system') || error.message?.includes('content that is not allowed')) {
          throw new Error("Your edit request was flagged by our content safety system. Common triggers include:\n\n• Brand-related words: 'logo', 'trademark', 'brand', company names\n• Specific product names: 'Nike', 'Adidas', 'Supreme', etc.\n• Aggressive language: 'CRITICAL', 'MUST', 'at all costs'\n• Complex multi-step instructions\n\nTry using alternative words like:\n• 'logo' → 'graphic design', 'emblem', 'decorative element'\n• 'brand' → 'design', 'pattern', 'motif'\n• Remove demanding language and keep instructions simple\n\nPlease rephrase your request using gentler, more generic terms.");
        } else if (error.message?.includes('invalid') || error.message?.includes('format')) {
          throw new Error("There was an issue with the image format. Please try regenerating the design or use simpler edit instructions.");
        } else {
          throw new Error("Your request couldn't be processed. Please try with simpler edit instructions or regenerate the design.");
        }
      } else if (error.status === 429) {
        throw new Error("Our AI service is busy right now. Please wait a moment and try again.");
      } else if (error.status >= 500) {
        throw new Error("Our AI service is temporarily unavailable. Please try again in a few minutes.");
      } else {
        throw new Error(`AI service error: ${error.message || 'Please try again with different instructions.'}`);
      }
    }
    
    if (error.message.includes('timed out')) {
      throw new Error("The edit request took too long to complete. Please try again with simpler modifications or try again later.");
    }
    
    throw new Error(`Failed to edit design: ${error.message || 'Please try regenerating the design or using simpler edit instructions.'}`);
  }
}

export async function editPortraitFrontWithReference(originalFrontImage, referenceImages, editPrompt, options = {}) {
  if (!originalFrontImage) {
    throw new Error("Original front image is required.");
  }

  const enhancedPrompt = `
${editPrompt}

Please maintain design consistency with the reference images:
- Keep the original garment's color, pattern, texture, and overall aesthetic
- Preserve the same fabric type, fit, and styling details
- Apply only the specific modifications requested above
- The edited result should look like the same garment with the requested adjustments

Please ensure photorealistic quality:
- The image should look like a real photograph
- Include realistic textures, lighting, shadows, and fabric details
- Use natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism

Fashion editorial style requirements:
- Full-body shot showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a lower angle (slightly below eye level) for a flattering silhouette
- Camera positioned at appropriate distance with generous spacing around the model
- Ensure ample space at top and bottom of frame
- Show the complete figure and styling with ample breathing room

Please use the provided reference images to maintain style consistency. Preserve the original model pose, background, lighting, and overall composition. Only modify the front view as specified. Use fictional branding and avoid any real-world brand references.
`.trim();

  return await editImageWithReference(
    originalFrontImage,
    referenceImages,
    enhancedPrompt,
    { ...options, size: "1024x1536", view: 'front' }
  );
}

export async function editPortraitBackWithReference(originalBackImage, referenceImages, editPrompt, options = {}) {
  if (!originalBackImage) {
    throw new Error("Original back image is required.");
  }

  if (!referenceImages || referenceImages.length === 0) {
    throw new Error("Reference images (including new front) are required for back editing.");
  }

  const enhancedPrompt = `
${editPrompt}

Please maintain design consistency with the reference images:
- The back view should match the front design closely
- Use the reference images to ensure consistency in color, pattern, texture, and design elements
- The garment should look like the same piece of clothing from both angles
- Preserve design elements, embroidery, patterns, colors, and styling from the front reference
- If the front has metallic embroidery, the back should have similar metallic embroidery
- If the front has specific colors or gradients, the back should match them
- The fabric texture, sheen, and material properties should be similar
- Apply only the specific back modifications requested, while maintaining front design consistency

Please ensure photorealistic quality:
- The image should look like a real photograph
- Include realistic textures, lighting, shadows, and fabric details
- Use natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism

Fashion editorial style requirements:
- Full-body shot showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a lower angle (slightly below eye level) for a flattering silhouette
- Camera positioned at appropriate distance with generous spacing around the model
- Ensure ample space at top and bottom of frame
- Show the complete figure and styling with ample breathing room

Please match the style, color, and design elements of the provided reference images. The back view should look like the same garment as shown in the reference images. Only apply the requested edits to the back view. Please keep the model, pose, and background consistent.

Please use the provided reference images to maintain style consistency. Ensure the back view matches the design elements, colors, and overall aesthetic of the reference images. Use fictional branding and avoid any real-world brand references.
`.trim();

  return await editImageWithReference(
    originalBackImage,
    referenceImages,
    enhancedPrompt,
    { ...options, size: "1024x1536", view: 'back' }
  );
}

export async function editLandscapeWithReference(originalLandscapeImage, referenceImages, editPrompt, options = {}) {
  if (!originalLandscapeImage) {
    throw new Error("Original landscape image is required.");
  }

  const enhancedPrompt = `
${editPrompt}

Please maintain design consistency with the reference images:
- Keep the original garment's color, pattern, texture, and overall aesthetic
- Preserve the same fabric type, fit, and styling details
- The front and back views should look like the same garment
- Apply only the specific modifications requested above
- The edited result should look like the same garment with the requested adjustments

Please ensure photorealistic quality:
- The image should look like a real photograph
- Include realistic textures, lighting, shadows, and fabric details
- Use natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism

Fashion editorial style requirements:
- Full-body shots showing the complete model from head to toe in both panels
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a lower angle (slightly below eye level) for a flattering silhouette
- Framing should include the full body from head to toe with generous spacing above and below

This is a split-panel landscape image with front view (left) and back view (right). Please preserve the original model pose, background, lighting, garment structure, and color. Only modify as described above. Please keep other details consistent.

${referenceImages && referenceImages.length > 0 ? 'Please use the provided reference images to maintain style consistency. Ensure the edited image matches the design elements, colors, and overall aesthetic of the reference images.' : 'Please maintain consistency with the original design.'} Use fictional branding and avoid any real-world brand references.
`.trim();

  return await editImageWithReference(
    originalLandscapeImage,
    referenceImages || [],
    enhancedPrompt,
    { ...options, size: "1536x1024" }
  );
} 