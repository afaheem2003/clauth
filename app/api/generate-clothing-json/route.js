import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ITEM_TYPES } from "@/app/constants/options";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const data = await req.json();
    const { itemDescription, designDetails, modelDetails } = data;

    if (!itemDescription?.trim() || !designDetails?.trim() || !modelDetails?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Generate item name, description, and type
    const itemDetailsCompletion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are a fashion copywriter creating engaging product names and descriptions. 
The available item types are: ${ITEM_TYPES.map(t => t.value).join(', ')}.
You must respond with a JSON object containing exactly these fields:
{
  "name": "a catchy, marketable name (3-5 words)",
  "description": "an engaging product description (2-3 sentences)",
  "itemType": "the most appropriate item type from the available options"
}`
        },
        {
          role: "user",
          content: `Create a product listing based on:
Main Item: ${itemDescription}
Design Details: ${designDetails}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const itemDetails = JSON.parse(itemDetailsCompletion.choices[0].message.content);

    // Step 2: Parse design details into front and back components
    const designCompletion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that parses clothing design descriptions into front and back components. 
You must respond with a JSON object containing exactly these fields:
{
  "frontText": "description of front elements",
  "backText": "description of back elements"
}`
        },
        {
          role: "user",
          content: `Parse the following clothing design description into separate front and back components.
Only extract explicitly mentioned design elements. Do not add or infer additional details.

Design Description: "${designDetails}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsedDesign = JSON.parse(designCompletion.choices[0].message.content);

    // Extract style, color, and texture information using basic pattern matching
    const colorMatch = itemDescription.match(/\b\w+(?:\s+\w+)*\s+(colored?|colou?red?|print|pattern|dyed)\b/i) || 
                      itemDescription.match(/\b(black|white|red|blue|green|yellow|purple|pink|brown|gray|grey|orange|navy|maroon|teal|gold|silver)\b/i);
    const color = colorMatch ? colorMatch[0] : '';

    const textureMatch = itemDescription.match(/\b(cotton|silk|wool|linen|denim|leather|velvet|satin|polyester|nylon|fleece|knit)\b/i);
    const texture = textureMatch ? textureMatch[0] : '';

    const styleMatch = itemDescription.match(/\b(casual|formal|sporty|elegant|vintage|modern|classic|bohemian|minimalist|streetwear)\b/i);
    const style = styleMatch ? styleMatch[0] : '';

    // Construct the prompt JSON data according to the schema
    const promptJsonData = {
      itemDescription,
      designDetails,
      frontText: parsedDesign.frontText,
      backText: parsedDesign.backText,
      modelDetails,
      style,
      color,
      texture,
      // Add the generated details
      name: itemDetails.name,
      description: itemDetails.description,
      itemType: itemDetails.itemType
    };

    // Basic cost estimation based on complexity
    const estimatedCost = calculateEstimatedCost(promptJsonData);
    const suggestedPrice = Math.ceil(estimatedCost * 2.5); // 150% markup

    return NextResponse.json({
      promptJsonData,
      estimatedCost,
      suggestedPrice
    });

  } catch (error) {
    console.error('Error in generate-clothing-json:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process design details' },
      { status: 500 }
    );
  }
}

function calculateEstimatedCost(promptJsonData) {
  let baseCost = 20; // Base cost for any item

  // Add costs based on complexity
  const complexityFactors = {
    hasFrontDesign: promptJsonData.frontText.length > 0 ? 5 : 0,
    hasBackDesign: promptJsonData.backText.length > 0 ? 5 : 0,
    hasDetailedDescription: promptJsonData.designDetails.length > 100 ? 5 : 0,
    isPremiumMaterial: ['silk', 'leather', 'wool'].some(material => 
      promptJsonData.texture.toLowerCase().includes(material)
    ) ? 10 : 0
  };

  return baseCost + Object.values(complexityFactors).reduce((sum, cost) => sum + cost, 0);
} 