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

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

FASHION EDITORIAL STYLE REQUIREMENTS:
- FULL-BODY shots showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a LOWER ANGLE (slightly below eye level) to create a more flattering, elongated silhouette
- Camera positioned at APPROPRIATE DISTANCE with generous spacing - ensure significant space between the top of the image and the model's head, and between the bottom of the image and the model's feet
- The model should appear tall and elegant with proper proportions
- Avoid close-up or cropped shots - show the complete figure and styling with ample breathing room
- Professional fashion photography composition and lighting

Both panels must feature the same hyperrealistic runway model wearing the exact same clothing item. The image should appear professionally photographed under consistent **studio lighting** with a **clean, neutral background**. The background must be plain and free of any props, scenery, textures, or visual distractions.

🔹 Left Panel (Front View):
Display the model facing directly forward in a full-body pose, showcasing the complete front view of a ${mainClothingItem}.
The front design should include: ${parsed.frontText}

🔹 Right Panel (Back View):
Display the same model facing directly backward in a full-body pose, showcasing the complete back view of the same ${mainClothingItem}.
The back design should include: ${parsed.backText}

🧍 Model Appearance:
The same model must appear in both panels. Appearance details: ${modelDescription}

🔧 Image Requirements:
- Use identical studio conditions across both panels (lighting, pose style, camera distance, proportions)
- Match professional fashion magazine editorial photography standards
- FULL-BODY composition showing complete model from head to toe with generous spacing around the figure
- Camera angle slightly below eye level to create an elongated, flattering silhouette
- Ensure ample space at top and bottom of frame - model should not fill the entire vertical space
- PHOTOREALISTIC rendering of all elements - fabric textures, lighting, shadows, and human features
- The clothing should be faithfully rendered from both sides with realistic material properties
- Text or lettering printed on the clothing (e.g., logos, mottos, crests) is welcome and encouraged if described
- Do **not** include any unrelated UI text, captions, labels, borders, watermarks, shadows, or props
- The **background must remain clean and neutral** in both panels — no gradients, patterns, or depth of field effects

Final Output:
A clean, high-quality, PHOTOREALISTIC full-body side-by-side comparison of the same item viewed from front and back, using fashion magazine editorial photography style and the same model throughout. The model should appear tall and elegant with proper spacing around the figure.
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