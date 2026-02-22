import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'images', 'waitlist');
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f));
  const images = files.map(f => `/images/waitlist/${f}`);
  return NextResponse.json({ images });
}
