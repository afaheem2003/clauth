// services/openaiService.js

import OpenAI from 'openai';
import clothingPromptSchema from '../schemas/clothingPromptSchema.js';
import { ITEM_TYPES } from '@/app/constants/options';
import { Readable } from 'stream';

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

    const basePrompt = `
Generate a high-resolution horizontal (landscape) image, sized exactly 1536x1024 pixels, showing two views of the same model and clothing item positioned side by side.

CRITICAL LAYOUT REQUIREMENTS:
- NO dividers, borders, lines, or separators between the left and right areas
- The background must flow seamlessly across the entire width of the image
- Think of this as ONE continuous studio space photographed from two angles, not two separate panels
- The lighting and studio environment should be consistent and uninterrupted across the full image width

Both areas must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent studio lighting with a clean, neutral background that extends seamlessly across the entire image width.

IMPORTANT BRAND SAFETY NOTE:
Do **not** use or reference any real-world brand names, logos, university names, slogans, or trademarks (e.g., "Nike", "Harvard", "Burberry", "Fighting Irish"). Every design element, label, or text must be **original** and fictional. Use made-up names, slogans, or symbols that are safe for commercial use.

Left Area (Front View):
Display the model facing directly forward, showcasing the front of a ${itemDescription}.
The front design should include: ${frontDesign}

Right Area (Back View):
Display the same model facing directly backward, showcasing the back of the same ${itemDescription}.
The back design should include: ${backDesign}

Model Appearance:
The same model must appear in both areas. Appearance details: ${modelDetails}

Image Requirements:
- ONE continuous studio background that flows seamlessly across the entire 1536x1024 image
- NO visual separators, dividers, lines, or borders anywhere in the image
- Use identical studio conditions across both areas (lighting, pose style, camera distance, proportions)
- Match professional fashion catalog or editorial photography standards
- The clothing should be faithfully rendered from both sides
- Text or lettering printed on the clothing (e.g., logos, mottos, crests) is welcome and encouraged if described, but must be fictional and **not** resemble any existing brands or slogans
- Do **not** include any unrelated UI text, captions, labels, borders, watermarks, shadows, or props
- The background must be a single, continuous, clean neutral surface with no interruptions

Final Output:
A clean, high-quality comparison of the same item viewed from front and back, appearing as if photographed in one continuous studio space with no visual dividers or separations.
`.trim();

    const requestOptions = {
      model,
      prompt: basePrompt,
      n: 1,
      size,
      quality
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

export async function inpaintImageWithOpenAI(originalImage, maskImage, inpaintingData, options = {}) {
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
      originalColor = ''
    } = options;

    // Convert base64 strings to buffers
    console.log("[OpenAI Service] Converting images to buffers...");
    const imageBuffer = Buffer.from(originalImage, 'base64');
    const maskBuffer = Buffer.from(maskImage, 'base64');
    console.log("[OpenAI Service] Image buffer size:", imageBuffer.length, "Mask buffer size:", maskBuffer.length);

    // Create a concise inpainting prompt
    const inpaintingPrompt = `
Modify this 1536x1024 split-panel studio image of a ${originalItemType} in ${originalColor}.

Left Panel (Front View):
${inpaintingData.frontModifications}

Right Panel (Back View):
${inpaintingData.backModifications}

Preserve the original model pose, background, lighting, garment structure, and color. Only modify as described above. Do not change any other details. Avoid real-world brand references.
`.trim();

    console.log("[OpenAI Service] Making inpainting request to OpenAI...");
    console.log("[OpenAI Service] Prompt:", inpaintingPrompt);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Inpainting request timed out after 2 minutes')), 120000);
    });

    // Make the API call with proper file objects
    const response = await Promise.race([
      openai.images.edit({
        model,
        prompt: inpaintingPrompt,
        image: new File([imageBuffer], 'image.png', { type: 'image/png' }),
        mask: new File([maskBuffer], 'mask.png', { type: 'image/png' }),
        n: 1,
        size,
        quality
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

export async function getAIInpaintingInsights(inpaintingPrompt, originalItemType, originalColor) {
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
        content: `You are an AI fashion designer specializing in precise clothing modifications. Your task is to parse user edit requests and create structured inpainting instructions.

CRITICAL GUIDELINES:
1. PRESERVE the original model appearance - same pose, lighting, background, and model features
2. ONLY modify elements explicitly mentioned in the user's edit request
3. Maintain the same ${originalItemType} base garment in ${originalColor}
4. Focus on CONCRETE, VISUAL modifications only
5. Specify exact placement and appearance of changes
6. Keep all unchanged elements exactly as they were

Your response must include:
1. Clear front view modifications (what changes on the front)
2. Clear back view modifications (what changes on the back)
3. A preservation note about maintaining unchanged elements

🚫 DO NOT change the model, background, lighting, or any unmentioned design elements.`
      },
      {
        role: "user",
        content: `Original item: ${originalItemType} in ${originalColor}
User's edit request: "${inpaintingPrompt}"

Parse this into structured front and back modifications. If the edit doesn't specify front or back, apply it to the most logical location(s).`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: inpaintingMessages,
      functions: [{
        name: "generateInpaintingInstructions",
        description: "Generates structured inpainting instructions for clothing modifications",
        parameters: {
          type: "object",
          properties: {
            frontModifications: { 
              type: "string", 
              description: "Precise description of changes to make on the front view. If no front changes, say 'No changes to front view.'" 
            },
            backModifications: { 
              type: "string", 
              description: "Precise description of changes to make on the back view. If no back changes, say 'No changes to back view.'" 
            },
            preservationNote: { 
              type: "string", 
              description: "Instructions on what to keep unchanged (model, pose, lighting, unmentioned design elements)" 
            },
            modificationSummary: { 
              type: "string", 
              description: "Brief summary of the overall change being made" 
            }
          },
          required: ["frontModifications", "backModifications", "preservationNote", "modificationSummary"]
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