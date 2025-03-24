import { NextResponse } from "next/server";

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
];

// Prevents duplicate word replacements
function cleanUpText(text) {
  text = text.replace(/\b(\w+)\s+\1\b/gi, "$1"); // Remove duplicate words
  text = text.replace(/\s{2,}/g, " "); // Fix extra spaces
  return text.trim();
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    let sanitizedPrompt = prompt.toLowerCase();

    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      sanitizedPrompt = sanitizedPrompt.replace(pattern, replacement);
    });

    sanitizedPrompt = cleanUpText(sanitizedPrompt); // Apply final cleanup

    if (!sanitizedPrompt.includes("under 12 inches")) {
      sanitizedPrompt +=
        " The plush is small, under 12 inches for easy manufacturing, made from soft, commercial-grade materials such as cotton or polyester blend. It has a rounded, symmetrical body, with clearly defined stitching and embroidered facial features for durability and ease of mass production.";
    }

    return NextResponse.json({ sanitizedPrompt });
  } catch (error) {
    return NextResponse.json(
      { error: "Error sanitizing prompt" },
      { status: 500 }
    );
  }
}
