// schemas/clothingPromptSchema.js

const clothingPromptSchema = {
  type: "object",
  properties: {
    productType: { type: "string", description: "The type of clothing item, e.g., hoodie, t-shirt, hat." },
    baseColor: { type: "string", description: "The primary color of the clothing item, e.g., white, black, blue." },
    graphics: {
      type: "array",
      description: "An array of graphic elements to be placed on the clothing item.",
      items: {
        type: "object",
        properties: {
          placement: { type: "string", description: "Where the graphic is placed, e.g., front center, left sleeve, back." },
          description: { type: "string", description: "A description of the graphic itself, e.g., red heart, blue flames, company logo." },
          visibility: {
            type: "array",
            description: "Which angles this graphic is visible from (front, left_3_4, right_3_4, back).",
            items: { 
              type: "string",
              enum: ["front", "left_3_4", "right_3_4", "back"] 
            }
          }
        },
        required: ["placement", "description", "visibility"]
      }
    }
  },
  required: ["productType", "baseColor", "graphics"]
};

export default clothingPromptSchema; 