// services/openaiService.js

import OpenAI from 'openai';
import clothingPromptSchema from '../schemas/clothingPromptSchema.js';

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
      content: "You are a fashion prompt architect. Your job is to take user descriptions of clothing and return structured JSON according to the provided schema. Think carefully about visibility of each graphic from different angles. The available angles are: front, left_3_4, right_3_4, and back. Ensure the visibility array for each graphic only contains valid angle strings: \"front\", \"left_3_4\", \"right_3_4\", \"back\"."
    },
    {
      role: "user",
      content: `User Description: "${userDescription}"`
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


export async function getAIDesignerInsights(creativePrompt, goalQuantity = 100) {
  if (!creativePrompt || typeof creativePrompt !== 'string' || creativePrompt.trim() === '') {
    throw new Error('Creative prompt cannot be empty.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured.");
  }

  let promptJsonData;

  // Step 1: Get Structured Item Details (adapted from getStructuredClothingJSON)
  try {
    console.log("[AI Insights] Step 1: Getting structured item details...");
    const itemDetailsMessages = [
      {
        role: "system",
        content: "You are an AI fashion designer and prompt architect. Based on the user's creative idea, generate a structured JSON object describing a single clothing item using the provided schema. \n\nIMPORTANT: If the user describes an entire outfit or multiple items, your primary task is to identify the single most prominent or 'main' clothing item from that description. Then, all the details you provide (itemName, itemType, description, visualDetails, suggestedMaterials, etc.) must pertain *only* to that single main item. Do not describe the entire outfit; focus exclusively on the chosen main piece. \n\nInfer details like item name, type, and description for this main item. Also, provide its visual characteristics (colors, patterns, textures, graphics, key features) and suggest 1-2 high-quality, realistic materials suitable for it. Ensure all details are suitable for a unique, high-quality clothing item. The user is building an AI native fashion house."
      },
      {
        role: "user",
        content: `Creative Idea: "${creativePrompt}"`
      }
    ];
    const itemDetailsFunctions = [
      {
        name: "generateClothingItemDetails", // Function name for clarity
        description: "Generates structured JSON for a clothing design based on a creative idea, including item name, type, description, visual details, and suggested materials.",
        parameters: clothingPromptSchema // Using existing schema
      }
    ];

    const itemDetailsResponse = await openai.chat.completions.create({
      model: "gpt-4-0613", 
      messages: itemDetailsMessages,
      functions: itemDetailsFunctions,
      function_call: { name: "generateClothingItemDetails" }
    });

    const itemMessage = itemDetailsResponse.choices[0].message;
    if (itemMessage.function_call && itemMessage.function_call.arguments) {
      promptJsonData = JSON.parse(itemMessage.function_call.arguments);
      console.log("[AI Insights] Step 1 successful. promptJsonData obtained.");
    } else {
      console.error("[AI Insights] Step 1 Failed: OpenAI response did not include expected function call for item details.", itemDetailsResponse);
      throw new Error("AI did not return structured item details.");
    }
  } catch (error) {
    console.error("[AI Insights] Step 1 Error: Failed to get structured item details from OpenAI:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (Item Details): ${error.status} ${error.name} - ${error.message}`);
    }
    throw error; // Re-throw original error or a new one
  }

  // Step 2: Estimate Cost
let estimatedCost = null;
try {
  console.log("[AI Insights] Step 2: Estimating production cost...");

  const itemDescriptionForCost = `
Item: ${promptJsonData.name || 'N/A'}
Type: ${promptJsonData.itemType || 'N/A'}
Description: ${promptJsonData.description || 'N/A'}
Graphics: ${promptJsonData.graphics?.map(g => g.description).join(', ') || 'None'}
Materials: ${promptJsonData.suggestedMaterials?.join(', ') || 'Cotton'}
Weight: ${promptJsonData.weight || 'Medium'}
Add-ons: ${promptJsonData.embellishments?.join(', ') || 'None'}
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

🧾 Internal Breakdown (mentally, not in output): 
- Evaluate complexity based on item type, fabric weight, and embellishments.
- Add $5 flat shipping/logistics after that.

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
    console.log("[AI Insights] Raw cost text from OpenAI:", costText);
    const match = costText.match(/\d+(\.\d{1,2})?/);
    if (match && match[0]) {
      estimatedCost = parseFloat(match[0]);
      console.log(`[AI Insights] Step 2 successful. Estimated cost: ${estimatedCost}`);
    } else {
      console.warn("[AI Insights] Step 2: Could not parse numerical cost from OpenAI response:", costText);
    }
  } else {
    console.warn("[AI Insights] Step 2: No content in OpenAI cost estimation response.");
  }
} catch (error) {
  console.error("[AI Insights] Step 2 Error: Failed to estimate cost from OpenAI:", error);
  if (error instanceof OpenAI.APIError) {
    console.error(`OpenAI API Error (Cost Estimation): ${error.status} ${error.name} - ${error.message}`);
  }
}

  // Step 3: Calculate Suggested Price
  let suggestedPrice = null;
  if (estimatedCost !== null && !isNaN(estimatedCost)) {
    suggestedPrice = parseFloat((estimatedCost * 2.0).toFixed(2));
    console.log(`[AI Insights] Step 3 successful. Suggested price (2x landed margin): ${suggestedPrice}`);
  } else {
    console.warn("[AI Insights] Step 3: Cannot calculate suggested price due to invalid estimated cost.");
  }

  // Step 4: Estimate Shipping Time
  let estimatedShippingWeeks = null;
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
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('Prompt cannot be empty for OpenAI image generation.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    throw new Error("OpenAI API key is not configured for image generation.");
  }

  try {
    console.log("[OpenAI Service] Generating multi-angle image with GPT-Image-1 for prompt:", prompt);
    
    // Default options
    const {
      model = "gpt-image-1",
      size = "1024x1024",
      promptJsonData = null,
      background = "auto" // 'auto', 'transparent', or 'opaque'
    } = options;

    // Validate options
    if (size !== "1024x1024") {
      throw new Error("gpt-image-1 only supports 1024x1024 size");
    }

    // Create a composite prompt that shows all angles in a 2x2 grid
    const compositePrompt = `Create a professional multi-angle fashion catalog image in a 2x2 layout showing a single clothing item being worn by the same **human runway model** in each quadrant.

    Views to show:
    - Top Left: Front view
    - Top Right: Right 3/4 view
    - Bottom Left: Left 3/4 view
    - Bottom Right: Back view
    
    Each quadrant should show the model wearing the clothing from the specified angle, under consistent studio lighting, with subtle changes in pose to reflect the angle.
    
    Do not add labels, borders, or text — just the four views in a clean 2x2 image.
    
    Clothing description: ${prompt}
    
    ${promptJsonData ? `- Emphasize these specific visual details in all views: ${JSON.stringify(promptJsonData.graphics || [])}` : ''}
    `;

    const response = await openai.images.generate({
      model,
      prompt: compositePrompt,
      n: 1,
      size,
      background
    });

    // Check for either URL or base64 data in the response
    const imageData = response.data[0];
    console.log("[OpenAI Service] Response data format:", {
      hasUrl: !!imageData.url,
      hasB64: !!imageData.b64_json,
      b64Length: imageData.b64_json?.length,
      responseKeys: Object.keys(imageData)
    });

    if (imageData.url) {
      console.log("[OpenAI Service] GPT-Image-1 multi-angle image URL received successfully.");
      return imageData.url;
    } else if (imageData.b64_json) {
      console.log("[OpenAI Service] GPT-Image-1 multi-angle image base64 data received successfully.");
      // Return the raw base64 string
      return imageData.b64_json;
    } else {
      console.error("[OpenAI Service] GPT-Image-1 did not return valid image data.", response);
      throw new Error("Failed to get valid image data from GPT-Image-1.");
    }

  } catch (error) {
    console.error("[OpenAI Service] Error generating multi-angle image with GPT-Image-1:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (GPT-Image-1): ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error("Failed to generate multi-angle image using GPT-Image-1.");
  }
} 