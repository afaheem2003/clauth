// app/api/sanitize-prompt/route.js
import { NextResponse }   from 'next/server';
import sanitizePrompt     from '@/lib/sanitizePrompt';

export async function POST(req) {
  const { prompt } = await req.json();
  const cleaned    = sanitizePrompt(prompt);
  return NextResponse.json({ prompt: cleaned });
}
