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

export async function getStructuredClothingJSON(userDescription) {
  if (!userDescription || typeof userDescription !== 'string' || userDescription.trim() === '') {
    throw new Error('User description cannot be empty.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set. Please add it to your .env file.");
    throw new Error("OpenAI API key is not configured. Cannot generate clothing JSON.");
  }

  const messages = [
    {
      role: "system",
      content: `
You are a fashion prompt architect. Your job is to take user descriptions of clothing and return structured JSON according to the provided schema.

Instead of using 'placement' for each graphic, describe what should be visible from **each of the following angles**:
- front
- back

Do not use 'placement'. Focus on what's actually seen from each angle, even if it's overlapping or the same.

Return a JSON object with 'graphicsByAngle' mapping each view to a string description of the visual details at that angle.
`
    },
    {
      role: "user",
      content: `
Your job is to sanitize the user input for any branded or trademarked references. 
Replace brand names (e.g., 'Burberry', 'Nike', 'Chanel') with **generic fashion descriptors** 
(e.g., 'plaid print', 'luxury sportswear', 'designer look') that convey the same aesthetic.

Then, return a cleaned version of the input that is **safe for commercial use** and free of brand references.

User input: """${userDescription}"""
`
    }
  ];

  const functions = [
    {
      name: "generateClothingPrompt",
      description: "Generates structured JSON for a clothing design based on a user description.",
      parameters: clothingPromptSchema
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-0613", // Or your preferred model that supports function calling
      messages: messages,
      functions: functions,
      function_call: { name: "generateClothingPrompt" } // Force the model to call this function
    });

    const message = response.choices[0].message;

    if (message.function_call && message.function_call.arguments) {
      const functionArgs = message.function_call.arguments;
      try {
        const structuredJSON = JSON.parse(functionArgs);
        // TODO: Add validation against the schema here if desired, 
        // though OpenAI function calling usually adheres well.
        return structuredJSON;
      } catch (parseError) {
        console.error("Error parsing JSON from OpenAI function call arguments:", parseError);
        console.error("Raw arguments from OpenAI:", functionArgs);
        throw new Error("Failed to parse structured JSON from AI response.");
      }
    } else {
      console.error("OpenAI response did not include expected function call or arguments:", response);
      throw new Error("AI did not return the expected structured data format.");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    // Check if it's an OpenAI API specific error
    if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error("Failed to generate clothing prompt JSON due to an external service error.");
  }
} 


export async function getAIDesignerInsights(structuredPrompt) {
  if (!structuredPrompt || typeof structuredPrompt !== 'object') {
    throw new Error('Structured prompt must be an object with required fields.');
  }

  const { itemDescription, frontDesign, backDesign, modelDetails } = structuredPrompt;

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
- If modelDetails contains "Generate appropriate model description", create a professional model description that complements the clothing style
- If modelDetails contains a user description, enhance and refine it for image generation
- Focus on professional modeling appearance, pose, and styling that suits the garment

Your response must include:
1. A clear, factual description
2. Precise front view details
3. Precise back view details
4. Professional model details for image generation

🚫 NO subjective descriptions, artistic interpretations, or non-visual elements.`
      },
      {
        role: "user",
        content: `Design Details:
Main Item: ${itemDescription}
Front Design: ${frontDesign}
Back Design: ${backDesign}
Model: ${modelDetails}

Generate a structured response focusing on CONCRETE, VISIBLE elements only.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
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
        promptJsonData = JSON.parse(itemMessage.function_call.arguments);
        console.log("[AI Insights] Successfully obtained promptJsonData:", promptJsonData);
      } catch (parseError) {
        console.error("[AI Insights] JSON parse error:", parseError);
        throw new Error("Failed to parse AI response into valid JSON");
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

export async function generateImageWithOpenAI(prompt, options = {}) {
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
      modelDetails = ''
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
- FULL-BODY shots showing the complete model from head to toe
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
      throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error("Failed to generate image.");
  }
}

export async function inpaintImageWithOpenAI(originalImage, maskImage, inpaintingData, options = {}, referenceImages = []) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  if (!originalImage || !maskImage) {
    throw new Error("Both original image and mask are required for inpainting.");
  }

  if (!inpaintingData) {
    throw new Error("Inpainting data with structured modifications is required.");
  }

  try {
    console.log("[OpenAI Service] Inpainting image with structured modifications:", inpaintingData);
    
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
    const maskBuffer = Buffer.from(maskImage, 'base64');
    const referenceBuffers = referenceImages.map(img => Buffer.from(img, 'base64'));

    // Detect image format from size parameter to generate appropriate prompt
    const isPortrait = size === "1024x1536";
    const isLandscape = size === "1536x1024";
    
    let inpaintingPrompt;
    if (isPortrait && view === 'back' && referenceImages.length > 0) {
      // Portrait back view with style reference
      inpaintingPrompt = `
Modify this ${size} portrait studio image of a ${originalItemType} in ${originalColor}.

${inpaintingData.backModifications}

STRICT REQUIREMENT: Match the style, color, and design elements of the provided front view image at all costs. The back view must look like the same garment as the front reference image. Only apply the requested edits to the back. Do not change the model, pose, or background.
`.trim();
    } else if (isPortrait && view === 'front') {
      // Portrait front view editing
      inpaintingPrompt = `
Modify this ${size} portrait studio image of a ${originalItemType} in ${originalColor}.

${inpaintingData.frontModifications}

Preserve the original model pose, background, lighting, and color. Only modify the front view as described above. Do not change any other details. Avoid real-world brand references.
`.trim();
    } else if (isPortrait && view === 'back') {
      // Portrait back view editing (no reference)
      inpaintingPrompt = `
Modify this ${size} portrait studio image of a ${originalItemType} in ${originalColor}.

${inpaintingData.backModifications}

Preserve the original model pose, background, lighting, and color. Only modify the back view as described above. Do not change any other details. Avoid real-world brand references.
`.trim();
    } else if (isPortrait) {
      // Portrait format: single image editing (fallback)
      const modifications = inpaintingData.frontModifications !== 'No changes to front view.' 
        ? inpaintingData.frontModifications 
        : inpaintingData.backModifications;
      
      inpaintingPrompt = `
Modify this ${size} portrait studio image of a ${originalItemType} in ${originalColor}.

${modifications}

Preserve the original model pose, background, lighting, and color. Only modify as described above. Do not change any other details. Avoid real-world brand references.
`.trim();
    } else if (isLandscape) {
      // Landscape format: split-panel editing
      inpaintingPrompt = `
Modify this ${size} split-panel studio image of a ${originalItemType} in ${originalColor}.

Left Panel (Front View):
${inpaintingData.frontModifications}

Right Panel (Back View):
${inpaintingData.backModifications}

Preserve the original model pose, background, lighting, garment structure, and color. Only modify as described above. Do not change any other details. Avoid real-world brand references.
`.trim();
    } else {
      // Fallback for unknown sizes
      inpaintingPrompt = `
Modify this ${size} studio image of a ${originalItemType} in ${originalColor}.

${inpaintingData.frontModifications}
${inpaintingData.backModifications}

Preserve the original model pose, background, lighting, and color. Only modify as described above. Do not change any other details. Avoid real-world brand references.
`.trim();
    }

    console.log("[OpenAI Service] Making inpainting request to OpenAI...");
    console.log("[OpenAI Service] Prompt:", inpaintingPrompt);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Inpainting request timed out after 2 minutes')), 120000);
    });

    // For OpenAI images.edit API, we can pass multiple images including reference images
    // Prepare image array for OpenAI API - main image first, then reference images
    let imageArray = [new File([imageBuffer], 'image.png', { type: 'image/png' })];
    
    // Add reference images if provided
    if (referenceBuffers.length > 0) {
      console.log(`[OpenAI Service] Adding ${referenceBuffers.length} reference image(s) for style consistency`);
      referenceBuffers.forEach((buf, idx) => {
        imageArray.push(new File([buf], `reference${idx + 1}.png`, { type: 'image/png' }));
      });
    }

    // Enhanced prompt when reference images are provided
    let finalPrompt = inpaintingPrompt;
    if (referenceBuffers.length > 0) {
      finalPrompt += `\n\nIMPORTANT: Use the provided reference image(s) to maintain style consistency. Ensure the edited image matches the design elements, colors, and overall aesthetic of the reference images.`;
    }

    console.log(`[OpenAI Service] Sending ${imageArray.length} image(s) to OpenAI`);
    console.log("[OpenAI Service] Final prompt:", finalPrompt);

    // Make the API call with multiple images if needed
    const response = await Promise.race([
      openai.images.edit({
        model,
        prompt: finalPrompt,
        image: imageArray,
        mask: new File([maskBuffer], 'mask.png', { type: 'image/png' }),
        n: 1,
        size,
        quality: quality
      }),
      timeoutPromise
    ]);

    console.log("[OpenAI Service] Received response from OpenAI inpainting");

    if (!response.data || !response.data[0]) {
      throw new Error("No valid response from inpainting");
    }

    const imageData = response.data[0];
    console.log("[OpenAI Service] Successfully completed inpainting");
    return imageData.b64_json;

  } catch (error) {
    console.error("[OpenAI Service] Error during inpainting:", error);
    console.error("[OpenAI Service] Error details:", {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    if (error instanceof OpenAI.APIError) {
      console.error("[OpenAI Service] Full OpenAI error:", JSON.stringify(error, null, 2));
      throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    if (error.message.includes('timed out')) {
      throw new Error("The inpainting request took too long to complete. Please try again with a simpler modification or try again later.");
    }
    throw new Error(`Failed to inpaint image: ${error.message}`);
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

IMPORTANT: For the updated design description, start with the original design description${originalDescription ? '' : ' (if available)'} and modify it to reflect all changes from the edit request. The result should be a complete description of the final design, not just the changes.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
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
              description: "Complete description of the final design after all modifications are applied. This should describe the entire garment and its features, not just what changed."
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
        const inpaintingData = JSON.parse(inpaintingMessage.function_call.arguments);
        console.log("[AI Inpainting Insights] Successfully obtained inpainting instructions:", inpaintingData);
        return { inpaintingData };
      } catch (parseError) {
        console.error("[AI Inpainting Insights] JSON parse error:", parseError);
        throw new Error("Failed to parse AI inpainting response into valid JSON");
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
        modelDetails = ''
      } = options;

      // Map internal quality levels to OpenAI quality values
      // Use quality parameter directly

      const portraitPrompt = `
Generate a high-resolution vertical (portrait) image, sized exactly 1024x1536 pixels, showing a single model wearing a clothing item from the front view.

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

LAYOUT REQUIREMENTS:
- Single front-facing view only
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

Model View (Front):
Display the model facing directly forward in a full-body pose, showcasing the complete front view of a ${itemDescription}.
The front design should include: ${frontDesign}

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

Final Output:
A clean, high-quality, PHOTOREALISTIC full-body portrait image showing the clothing item from the front view only, shot in fashion magazine editorial style. The model should appear tall and elegant with proper spacing around the figure.
`.trim();

      const requestOptions = {
        model,
        prompt: portraitPrompt,
        n: 1,
        size,
        quality: quality
      };

      console.log("[OpenAI Service] Using portrait generation mode");
      
      // Create timeout promise - increased from 3 to 5 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Portrait generation request timed out after 5 minutes')), 300000);
      });

      const response = await Promise.race([
        openai.images.generate(requestOptions),
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
    throw new Error(`OpenAI API Error: ${lastError.status} ${lastError.name} - ${lastError.message}`);
  }
  throw new Error(`Failed to generate portrait image after ${maxRetries} attempts: ${lastError.message}`);
}

export async function editPortraitToBackWithOpenAI(originalImage, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  if (!originalImage) {
    throw new Error("Original portrait image is required for back view editing.");
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OpenAI Service] Editing portrait to show back view (attempt ${attempt}/${maxRetries}) with options:`, options);
      
      // Default options
      const {
        model = "gpt-image-1",
        size = "1024x1536",
        quality = process.env.OPENAI_IMAGE_QUALITY || "high",
        itemDescription = '',
        backDesign = '',
        modelDetails = '',
        originalColor = ''
      } = options;

      // Convert base64 string to buffer
      console.log("[OpenAI Service] Converting portrait image to buffer...");
      const imageBuffer = Buffer.from(originalImage, 'base64');
      console.log("[OpenAI Service] Portrait image buffer size:", imageBuffer.length);

      // Create a smaller, targeted mask instead of full mask for better consistency
      // This creates a mask that covers the main clothing area but preserves more context
      const maskBuffer = await sharp({
        create: {
          width: 1024,
          height: 1536,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="1024" height="1536">
            <rect x="200" y="300" width="624" height="1000" fill="white" />
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();

      const backViewPrompt = `
Transform this front-view portrait into a back-view portrait of the EXACT SAME model and clothing item. 

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

CRITICAL REQUIREMENTS:
- Keep the EXACT SAME model appearance, pose style, and studio environment
- Keep the EXACT SAME clothing item and color (${originalColor})
- Change ONLY the viewing angle from front to back
- Maintain identical lighting, background, and proportions
- Show the back design: ${backDesign}
- Use the provided reference image to maintain perfect consistency with the front view

FASHION EDITORIAL STYLE REQUIREMENTS:
- FULL-BODY shot showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a LOWER ANGLE (slightly below eye level) to create a more flattering, elongated silhouette
- Camera positioned at APPROPRIATE DISTANCE with generous spacing - ensure significant space between the top of the image and the model's head, and between the bottom of the image and the model's feet
- The model should appear tall and elegant with proper proportions
- Avoid close-up or cropped shots - show the complete figure and styling with ample breathing room
- Professional fashion photography composition and lighting

The model should now be facing directly away from the camera in a full-body pose, showing the complete back view of the ${itemDescription} in ${originalColor}. Keep everything else identical to the original image - same model, same clothing item, same studio setup, same lighting conditions, same camera angle and framing.

IMPORTANT: Use the provided reference image to maintain style consistency. Ensure the back view matches the design elements, colors, and overall aesthetic of the front reference image. Maintain all fictional branding and avoid any real-world brand references. Ensure PHOTOREALISTIC rendering of all elements.
`.trim();

      console.log("[OpenAI Service] Making portrait back-view edit request to OpenAI...");
      console.log("[OpenAI Service] Prompt:", backViewPrompt);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Portrait editing request timed out after 5 minutes')), 300000);
      });

      // Prepare image array - original image first, then front image as reference
      let imageArray = [new File([imageBuffer], 'portrait.png', { type: 'image/png' })];
      
      // Add the front image as a reference for consistency
      console.log("[OpenAI Service] Adding front image as reference for style consistency");
      imageArray.push(new File([imageBuffer], 'front_reference.png', { type: 'image/png' }));

      console.log(`[OpenAI Service] Sending ${imageArray.length} image(s) to OpenAI (main + reference)`);

      // Make the API call with the front image as reference
      const response = await Promise.race([
        openai.images.edit({
          model,
          prompt: backViewPrompt,
          image: imageArray,
          mask: new File([maskBuffer], 'mask.png', { type: 'image/png' }),
          n: 1,
          size,
          quality: quality
        }),
        timeoutPromise
      ]);

      console.log("[OpenAI Service] Received response from OpenAI portrait editing");

      if (!response.data || !response.data[0]) {
        throw new Error("No valid response from portrait back-view editing");
      }

      const imageData = response.data[0];
      console.log("[OpenAI Service] Successfully completed portrait back-view editing with reference image");
      return imageData.b64_json;

    } catch (error) {
      lastError = error;
      console.error(`[OpenAI Service] Attempt ${attempt} failed:`, error.message);
      
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
        console.log(`[OpenAI Service] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If it's not retryable or we've exhausted retries, throw the error
      break;
    }
  }

  // If we get here, all retries failed
  console.error("[OpenAI Service] All attempts failed. Final error:", lastError);
  console.error("[OpenAI Service] Error details:", {
    name: lastError.name,
    message: lastError.message,
    status: lastError.status,
    code: lastError.code,
    type: lastError.type
  });
  
  if (lastError instanceof OpenAI.APIError) {
    console.error("[OpenAI Service] Full OpenAI error:", JSON.stringify(lastError, null, 2));
    throw new Error(`OpenAI API Error: ${lastError.status} ${lastError.name} - ${lastError.message}`);
  }
  if (lastError.message.includes('timed out')) {
    throw new Error("The portrait editing request took too long to complete. Please try again or try a different quality setting.");
  }
  throw new Error(`Failed to edit portrait to back view after ${maxRetries} attempts: ${lastError.message}`);
} 