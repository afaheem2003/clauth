const REPLACEMENTS = [
  {
    pattern:
      /\b(futuristic|cyberpunk|robotic|mechanical|metallic|sci-fi|steampunk|cybernetic|android|bionic|motorized|mechanized|ai-powered|exo-skeleton)\b/gi,
    replacement: "storybook-inspired",
  },
  {
    pattern:
      /\b(glowing|neon|LED|holographic|illuminated|light-up|bioluminescent|fiber-optic|reflective)\b/gi,
    replacement: "embroidered",
  },
  {
    pattern:
      /\b(wings|horns|ears|tails|scales|feathers|fins|claws|tentacles|mane|beak)\b/gi,
    replacement: "soft fabric $1",
  },
  {
    pattern:
      /\b(realistic eyes|LED eyes|plastic eyes|glass eyes|button eyes|animatronic eyes)\b/gi,
    replacement: "embroidered eyes",
  },
  {
    pattern: /\b(gigantic|huge|oversized|life-size|full-scale)\b/gi,
    replacement: "small, under 12 inches",
  },
  {
    pattern:
      /\b(leather|leather harness|leather strap|straps|belt|buckle|buckles|metal clasp|metal buckle)\b/gi,
    replacement: "fabric harness",
  },
  {
    pattern: /\b(buttons|metal buttons)\b/gi,
    replacement: "embroidered buttons",
  },
  {
    pattern: /\b(helmet|armor helmet|military helmet)\b/gi,
    replacement: "soft plush-style helmet",
  },
];

function cleanUpText(text) {
  text = text.replace(/\b(\w+)\s+\1\b/gi, "$1"); // remove duplicate words
  text = text.replace(/\s{2,}/g, " "); // remove extra spaces
  return text.trim();
}

export function sanitizePrompt(prompt) {
  let sanitized = prompt.toLowerCase();

  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  sanitized = cleanUpText(sanitized);

  // Ensure some default characteristics if not specified, tailored for clothing items
  if (!sanitized.includes("fabric details") && !sanitized.includes("material details")) { // Check for more generic terms
    sanitized +=
      " The clothing item is designed for comfort and style, made from quality, common fabrics like cotton or polyester blends. It features durable stitching and clear design elements suitable for apparel production.";
  }

  return sanitized;
}

export default sanitizePrompt;
