// schemas/clothingPromptSchema.js

const clothingPromptSchema = {
  type: "object",
  properties: {
    itemDescription: {
      type: "string",
      description: "Basic description of the main clothing item (e.g., 'oversized hoodie in charcoal grey')"
    },
    frontText: {
      type: "string",
      description: "Detailed description of what should appear on the front of the item"
    },
    backText: {
      type: "string",
      description: "Detailed description of what should appear on the back of the item"
    },
    modelDetails: {
      type: "string",
      description: "Description of the model's appearance (e.g., 'tall male model with curly hair, neutral expression')"
    },
    style: {
      type: "string",
      description: "Style description of the clothing"
    },
    color: {
      type: "string",
      description: "Color scheme of the clothing"
    },
    texture: {
      type: "string",
      description: "Texture and material description"
    }
  },
  required: ["itemDescription", "frontText", "backText", "modelDetails"]
};

export default clothingPromptSchema; 