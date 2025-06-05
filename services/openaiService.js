// services/openaiService.js

import OpenAI from 'openai';
import clothingPromptSchema from '../schemas/clothingPromptSchema.js';
import { ITEM_TYPES } from '@/app/constants/options';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env file
});

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

Your response must include:
1. A catchy, marketable name (3-5 words)
2. A clear, factual description
3. The type of clothing item (matching one of these exact values: ${ITEM_TYPES.map(t => t.value).join(', ')})
4. Precise front view details
5. Precise back view details
6. Base color and materials

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
            name: { type: "string", description: "Catchy, marketable name for the item" },
            description: { type: "string", description: "Clear, factual description focusing on visible elements" },
            itemType: { type: "string", description: "Type of clothing item" },
            productType: { type: "string", description: "The type of clothing item (for image generation)" },
            baseColor: { type: "string", description: "Primary color of the item" },
            frontDetails: { type: "string", description: "Precise description of front design elements and their placement" },
            backDetails: { type: "string", description: "Precise description of back design elements and their placement" },
            materials: { type: "array", items: { type: "string" }, description: "Material composition" }
          },
          required: ["name", "description", "itemType", "productType", "baseColor", "frontDetails", "backDetails"]
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
Generate a high-resolution horizontal (landscape) image, sized exactly 1536x1024 pixels, divided into two vertical panels of equal width.

Both panels must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent studio lighting with a clean, neutral background. The background must be plain and free of any props, scenery, textures, or visual distractions.

IMPORTANT BRAND SAFETY NOTE:
Do **not** use or reference any real-world brand names, logos, university names, slogans, or trademarks (e.g., "Nike", "Harvard", "Burberry", "Fighting Irish"). Every design element, label, or text must be **original** and fictional. Use made-up names, slogans, or symbols that are safe for commercial use.

Left Panel (Front View):
Display the model facing directly forward, showcasing the front of a ${itemDescription}.
The front design should include: ${frontDesign}

Right Panel (Back View):
Display the same model facing directly backward, showcasing the back of the same ${itemDescription}.
The back design should include: ${backDesign}

Model Appearance:
The same model must appear in both panels. Appearance details: ${modelDetails}

Image Requirements:
- Use identical studio conditions across both panels (lighting, pose style, camera distance, proportions)
- Match professional fashion catalog or editorial photography standards
- The clothing should be faithfully rendered from both sides
- Text or lettering printed on the clothing (e.g., logos, mottos, crests) is welcome and encouraged if described, but must be fictional and **not** resemble any existing brands or slogans
- Do **not** include any unrelated UI text, captions, labels, borders, watermarks, shadows, or props
- The background must remain clean and neutral in both panels — no gradients, patterns, or depth of field effects

Final Output:
A clean, high-quality, side-by-side comparison of the same item viewed from front and back, using studio photography style and the same model throughout.
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

export async function inpaintImageWithOpenAI(prompt, originalImage, maskImage, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  if (!originalImage || !maskImage) {
    throw new Error("Both original image and mask are required for inpainting.");
  }

  try {
    console.log("[OpenAI Service] Inpainting image with options:", options);
    
    // Default options
    const {
      model = "gpt-image-1",
      size = "1536x1024",
      quality = process.env.OPENAI_IMAGE_QUALITY || "high",
    } = options;

    const requestOptions = {
      model,
      prompt,
      image: originalImage,
      mask: maskImage,
      n: 1,
      size,
      quality,
      response_format: "b64_json"
    };

    console.log("[OpenAI Service] Using inpainting mode");
    const response = await openai.images.edit(requestOptions);

    if (!response.data || !response.data[0]) {
      throw new Error("No valid response from inpainting");
    }

    const imageData = response.data[0];
    return imageData.b64_json;

  } catch (error) {
    console.error("[OpenAI Service] Error during inpainting:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error("Failed to inpaint image.");
  }
} 