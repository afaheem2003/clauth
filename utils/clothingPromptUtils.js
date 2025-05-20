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

/**
 * Generates a composite prompt from the JSON data
 * @param {Object} promptJsonData - The prompt JSON data
 * @returns {string} - The composite prompt
 */
export function generateCompositePromptFromJSON(promptJsonData) {
  const {
    itemDescription,
    frontText,
    backText,
    modelDetails,
    style,
    color,
    texture
  } = promptJsonData;

  const parts = [
    itemDescription,
    frontText && `Front: ${frontText}`,
    backText && `Back: ${backText}`,
    modelDetails && `Model: ${modelDetails}`,
    style && `Style: ${style}`,
    color && `Color: ${color}`,
    texture && `Texture: ${texture}`
  ].filter(Boolean);

  return parts.join('. ');
}

/**
 * Generates the landscape prompt for image generation
 * @param {Object} data - The prompt data
 * @returns {string} - The formatted landscape prompt
 */
export function generateLandscapePrompt(data) {
  const { mainClothingItem, parsed, modelDescription } = data;
  
  return `
Generate a high-resolution horizontal (landscape) image, sized exactly 1536x1024 pixels, divided into two vertical panels of equal width.

Both panels must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent **studio lighting** with a **clean, neutral background**. The background must be plain and free of any props, scenery, textures, or visual distractions.

🔹 Left Panel (Front View):
Display the model facing directly forward, showcasing the front of a ${mainClothingItem}.
The front design should include: ${parsed.frontText}

🔹 Right Panel (Back View):
Display the same model facing directly backward, showcasing the back of the same ${mainClothingItem}.
The back design should include: ${parsed.backText}

🧍 Model Appearance:
The same model must appear in both panels. Appearance details: ${modelDescription}

🔧 Image Requirements:
- Use identical studio conditions across both panels (lighting, pose style, camera distance, proportions)
- Match professional fashion catalog or editorial photography standards
- The clothing should be faithfully rendered from both sides
- Text or lettering printed on the clothing (e.g., logos, mottos, crests) is welcome and encouraged if described
- Do **not** include any unrelated UI text, captions, labels, borders, watermarks, shadows, or props
- The **background must remain clean and neutral** in both panels — no gradients, patterns, or depth of field effects

Final Output:
A clean, high-quality, side-by-side comparison of the same item viewed from front and back, using studio photography style and the same model throughout.
`.trim();
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