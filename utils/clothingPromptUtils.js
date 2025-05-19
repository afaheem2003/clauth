// Placeholder for GPT-powered JSON generation
// IMPORTANT: You will need to replace the placeholder logic 
// with an actual call to a GPT model (e.g., OpenAI API)
// to achieve the desired free-text to structured JSON conversion.
export async function generateClothingPromptJSON(userDescription) {
  if (!userDescription || typeof userDescription !== 'string' || userDescription.trim() === '') {
    console.error("User description cannot be empty for generateClothingPromptJSON.");
    // Return a structure that won't break downstream consumers, or throw
    return {
      error: "User description was empty.",
      productType: "unknown",
      baseColor: "unknown",
      graphics: []
    };
  }

  try {
    const response = await fetch('/api/generate-clothing-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: userDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to fetch or parse error from generate-clothing-json API." }));
      console.error("Error from /api/generate-clothing-json:", errorData);
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const structuredJSON = await response.json();
    return structuredJSON;

  } catch (error) {
    console.error("Client-side error in generateClothingPromptJSON calling API:", error);
    // Fallback structure in case of error to prevent breaking UI components expecting specific fields
    return {
      error: error.message || "Failed to process clothing prompt.",
      productType: "unknown", // Default/fallback value
      baseColor: "unknown",   // Default/fallback value
      graphics: [],           // Default/fallback value
    };
  }
}

export function generateCompositePromptFromJSON(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    console.error("Invalid jsonData provided to generateCompositePromptFromJSON");
    return "Error: Invalid JSON data.";
  }

  const { productType, baseColor, graphics } = jsonData;

  if (!productType || !baseColor || !Array.isArray(graphics)) {
    return `Generate a hyperrealistic image of a ${baseColor || ''} ${productType || 'clothing item'}. Focus on clear product presentation in studio lighting.`;
  }
  
  const angles = {
    topLeft: { name: "front view", visibleKeywords: ["front", "chest", "center"] },
    topRight: { name: "left ¾ view", visibleKeywords: ["left", "sleeve", "side", "3/4", "¾"] },
    bottomLeft: { name: "right ¾ view", visibleKeywords: ["right", "sleeve", "side", "3/4", "¾"] },
    bottomRight: { name: "back view", visibleKeywords: ["back"] }
  };

  let compositePrompt = `Generate a hyperrealistic 2x2 composite layout showing a runway model wearing the same ${baseColor} ${productType}. Use clean studio lighting, consistent model, and identical garment representation across all views. Ensure the product is the main focus.\n\nDescription of the ${productType}:\nBase garment: A ${baseColor} ${productType}.\n`;

  if (graphics.length > 0) {
    compositePrompt += "Graphic elements:\n";
    graphics.forEach(g => {
      compositePrompt += `- ${g.description} on the ${g.placement}.\n`;
    });
  } else {
    compositePrompt += "No specific graphics described, focus on the base garment\'s texture and form.\n";
  }
  
  compositePrompt += "\nComposite Quadrants Details:\n";

  function getVisibleGraphicsForAngle(angleKey, allGraphics) {
    const visible = [];
    // const angleKeywords = angles[angleKey] ? angles[angleKey].visibleKeywords : [];
    
    allGraphics.forEach(graphic => {
      let isVisible = false;
      if (graphic.visibility && Array.isArray(graphic.visibility)) {
         if (graphic.visibility.some(v => angles[angleKey]?.name.toLowerCase().includes(v.replace('_', ' ').replace('3 4', '¾')))) {
           isVisible = true;
         }
      }
      
      if (isVisible) {
        visible.push(`${graphic.description} on the ${graphic.placement}`);
      }
    });
    return visible;
  }

  let tlGraphics = getVisibleGraphicsForAngle("topLeft", graphics);
  compositePrompt += `- Top Left Quadrant (Front View): Shows the ${productType} from the front. Visible details: ${tlGraphics.length > 0 ? tlGraphics.join(", ") : 'standard front details of the garment'}.\n`;

  let trGraphics = getVisibleGraphicsForAngle("topRight", graphics);
  compositePrompt += `- Top Right Quadrant (Left ¾ View): Shows the ${productType} from the left three-quarter angle. Visible details: ${trGraphics.length > 0 ? trGraphics.join(", ") : 'standard left ¾ details of the garment'}.\n`;

  let blGraphics = getVisibleGraphicsForAngle("bottomLeft", graphics);
  compositePrompt += `- Bottom Left Quadrant (Right ¾ View): Shows the ${productType} from the right three-quarter angle. Visible details: ${blGraphics.length > 0 ? blGraphics.join(", ") : 'standard right ¾ details of the garment'}.\n`;

  let brGraphics = getVisibleGraphicsForAngle("bottomRight", graphics);
  compositePrompt += `- Bottom Right Quadrant (Back View): Shows the ${productType} from the back. Visible details: ${brGraphics.length > 0 ? brGraphics.join(", ") : 'standard back details of the garment'}.\n`;

  compositePrompt += "\nIMPORTANT REMINDER: Maintain the same model, lighting, garment details, and overall setup across all four views for a cohesive composite image. The garment should be accurately depicted with its specified color and graphics in each view according to what\'s visible.";
  
  return compositePrompt;
}

/*
async function test() {
  const exampleUserDescription = "white hoodie with a red heart on the chest and blue flames on the sleeves";
  console.log("User Description:", exampleUserDescription);

  const jsonData = await generateClothingPromptJSON(exampleUserDescription);
  console.log("Generated JSON:", JSON.stringify(jsonData, null, 2));

  if (jsonData) {
    const compositePrompt = generateCompositePromptFromJSON(jsonData);
    console.log("\nComposite Prompt:\n", compositePrompt);
  }

  const exampleJson = {
      "productType": "hoodie",
      "baseColor": "white",
      "graphics": [
        {
          "placement": "front center",
          "description": "red heart",
          "visibility": ["front", "left_3_4", "right_3_4"]
        },
        {
          "placement": "both sleeves",
          "description": "blue flames",
          "visibility": ["left_3_4", "right_3_4", "back", "front"]
        }
      ]
    };
  const compositePromptFromExample = generateCompositePromptFromJSON(exampleJson);
  console.log("\nComposite Prompt from Direct JSON Example:\n", compositePromptFromExample);
}

test();
*/ 