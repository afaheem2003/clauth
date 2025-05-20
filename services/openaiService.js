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


export async function getAIDesignerInsights(structuredPrompt, goalQuantity = 100) {
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
  let estimatedCost = null;
  let suggestedPrice = null;
  let estimatedShippingWeeks = null;

  // Step 1: Get Structured Item Details
  try {
    console.log("[AI Insights] Step 1: Getting structured item details...");
    const itemDetailsMessages = [
      {
        role: "system",
        content: `You are an AI fashion designer and prompt architect. Based on the structured design details, generate a JSON object describing the clothing item. Your response should include:

        1. A catchy, marketable name for the item
        2. A clear, concise description
        3. The type of clothing item (matching one of these exact values: ${ITEM_TYPES.map(t => t.value).join(', ')})
        4. Visual details for both front and back views
        5. Suggested materials and construction details
        
        🚫 IMPORTANT: Do NOT use or reference any real-world brand names, company names, logos, slogans, university names, or trademarks (e.g., "Nike", "Burberry", "Harvard", "Coca-Cola", "Fighting Irish"). All names, visuals, and text must be **original**, fictional, and commercially safe.
        
        If any trademarked or brand terms appear in the user input, **replace them with fictional alternatives** that preserve the aesthetic or vibe.
        
        Focus on creating a cohesive, fictional design that incorporates the provided details.`
        
      },
      {
        role: "user",
        content: `Design Details:
        Main Item: ${itemDescription}
        Front Design: ${frontDesign}
        Back Design: ${backDesign}
        Model: ${modelDetails}`
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
            description: { type: "string", description: "Clear, concise description of the item" },
            itemType: { type: "string", description: "Type of clothing item" },
            productType: { type: "string", description: "The type of clothing item (for image generation)" },
            baseColor: { type: "string", description: "Primary color of the item" },
            frontDetails: { type: "string", description: "Description of front design elements" },
            backDetails: { type: "string", description: "Description of back design elements" },
            materials: { type: "array", items: { type: "string" }, description: "Suggested materials" }
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
        console.log("[AI Insights] Step 1 successful. promptJsonData obtained:", promptJsonData);
      } catch (parseError) {
        console.error("[AI Insights] JSON parse error:", parseError);
        throw new Error("Failed to parse AI response into valid JSON");
      }
    } else {
      console.error("[AI Insights] Step 1 Failed: OpenAI response did not include expected function call for item details.", response);
      throw new Error("AI did not return structured item details.");
    }
  } catch (error) {
    console.error("[AI Insights] Step 1 Error: Failed to get structured item details from OpenAI:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (Item Details): ${error.status} ${error.name} - ${error.message}`);
    }
    throw error;
  }

  // Step 2: Estimate Cost
  try {
    console.log("[AI Insights] Step 2: Estimating production cost...");

    const itemDescriptionForCost = `
Item: ${promptJsonData.name || 'N/A'}
Type: ${promptJsonData.itemType || 'N/A'}
Description: ${promptJsonData.description || 'N/A'}
Materials: ${promptJsonData.materials?.join(', ') || 'Cotton'}
`.trim();

    const costMessages = [
      {
        role: "system",
        content: `
You are a production cost estimator for high-quality clothing manufactured in Portugal.

Your job is to:
1. Estimate the base manufacturing cost (materials + labor) of the main item.
2. Add $5.00 USD to account for landed logistics (duties, shipping).
3. Return ONLY the final landed cost, rounded **up** and ending in ".95" (e.g., 22.95).

📊 Reference Examples (landed cost):
- Basic cotton t-shirt: $7.95
- Embroidered hoodie: $22.95
- Canvas tote bag: $5.95
- Heavyweight sweatshirt: $14.95

Return only a number like: 18.95 — no text, symbols, or breakdown.
      `.trim()
      },
      {
        role: "user",
        content: itemDescriptionForCost
      }
    ];

    const costResponse = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: costMessages,
      temperature: 0.2,
    });

    const costText = costResponse.choices[0].message.content;
    if (costText) {
      const match = costText.match(/\d+\.\d+/);
      if (match) {
        estimatedCost = parseFloat(match[0]);
        suggestedPrice = Math.ceil((estimatedCost * 2.5) / 5) * 5 - 0.05;
        console.log(`[AI Insights] Step 2 successful. Estimated cost: $${estimatedCost}, Suggested price: $${suggestedPrice}`);
      }
    }
  } catch (error) {
    console.error("[AI Insights] Step 2 Error: Failed to estimate cost:", error);
    // Don't throw, allow flow to continue with null cost/price
  }

  // Step 3: Calculate Suggested Price
  if (estimatedCost !== null && !isNaN(estimatedCost)) {
    suggestedPrice = parseFloat((estimatedCost * 2.0).toFixed(2));
    console.log(`[AI Insights] Step 3 successful. Suggested price (2x landed margin): ${suggestedPrice}`);
  } else {
    console.warn("[AI Insights] Step 3: Cannot calculate suggested price due to invalid estimated cost.");
  }

  // Step 4: Estimate Shipping Time
  try {
    console.log("[AI Insights] Step 4: Estimating shipping time...");
    const shippingMessages = [
      {
        role: "system",
        content: "You are a production and logistics expert for a clothing manufacturing facility in Portugal. Based on the item details and order quantity, estimate how many weeks it will take to manufacture and ship the items AFTER the campaign ends and funding goal is reached. Consider factors like: manufacturing complexity, quantity, material sourcing, and standard shipping times from Portugal. Return ONLY a single number representing the estimated weeks (e.g., '8' for 8 weeks). Your estimate should be realistic but optimistic, assuming no major supply chain issues."
      },
      {
        role: "user",
        content: `Item Details:
          Type: ${promptJsonData.itemType || 'N/A'}
          Quantity: ${goalQuantity} units
          Features: ${promptJsonData.description || 'N/A'}
          Graphics: ${promptJsonData.graphics ? promptJsonData.graphics.map(g => g.description).join(', ') : 'None'}
          
          Note: Manufacturing begins after successful campaign completion. Estimate total weeks from campaign end to customer delivery.`
      }
    ];

    const shippingResponse = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: shippingMessages,
      temperature: 0.2,
    });

    const shippingText = shippingResponse.choices[0].message.content;
    if (shippingText) {
      const match = shippingText.match(/\d+/);
      if (match) {
        estimatedShippingWeeks = parseInt(match[0]);
        console.log(`[AI Insights] Step 4 successful. Estimated shipping weeks: ${estimatedShippingWeeks}`);
      }
    }
  } catch (error) {
    console.error("[AI Insights] Step 4 Error: Failed to estimate shipping time:", error);
    // Don't throw, allow flow to continue with null shipping time
  }

  return { 
    promptJsonData, 
    estimatedCost, 
    suggestedPrice,
    estimatedShippingWeeks 
  };
} 

export async function generateImageWithOpenAI(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  try {
    console.log("[OpenAI Service] Generating dual-panel landscape image");
    
    // Default options
    const {
      model = "gpt-image-1",
      size = "1536x1024", // Updated for landscape format
      itemDescription = '',
      frontDesign = '',
      backDesign = '',
      modelDetails = '',
      background = "auto",
      quality = process.env.OPENAI_IMAGE_QUALITY || "high" // Default to high quality
    } = options;

    // Validate quality
    if (!["low", "high", "medium"].includes(quality)) {
      console.warn("[OpenAI Service] Invalid quality setting:", quality, "defaulting to high");
      quality = "high";
    }

    const landscapePrompt = `
    Generate a high-resolution horizontal (landscape) image, sized exactly 1536x1024 pixels, divided into two vertical panels of equal width.
    
    Both panels must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent **studio lighting** with a **clean, neutral background**. The background must be plain and free of any props, scenery, textures, or visual distractions.
    
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
    - The **background must remain clean and neutral** in both panels — no gradients, patterns, or depth of field effects
    
    Final Output:
    A clean, high-quality, side-by-side comparison of the same item viewed from front and back, using studio photography style and the same model throughout.
    `.trim();
    

    const response = await openai.images.generate({
      model,
      prompt: landscapePrompt,
      n: 1,
      size: "1536x1024", // Fixed size for landscape format
      background,
      quality
    });

    const imageData = response.data[0];
    console.log("[OpenAI Service] Response data format:", {
      hasUrl: !!imageData.url,
      hasB64: !!imageData.b64_json,
      b64Length: imageData.b64_json?.length,
      responseKeys: Object.keys(imageData)
    });

    if (imageData.url) {
      console.log("[OpenAI Service] Landscape dual-panel image URL received successfully.");
      return imageData.url;
    } else if (imageData.b64_json) {
      console.log("[OpenAI Service] Landscape dual-panel image base64 data received successfully.");
      return imageData.b64_json;
    } else {
      console.error("[OpenAI Service] Did not return valid image data.", response);
      throw new Error("Failed to get valid image data from OpenAI.");
    }

  } catch (error) {
    console.error("[OpenAI Service] Error generating landscape dual-panel image:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error("Failed to generate landscape dual-panel image.");
  }
} 