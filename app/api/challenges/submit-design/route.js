import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { 
      name, 
      itemType, 
      description, 
      promptRaw, 
      color, 
      style,
      challengeTheme,
      mainItem 
    } = await request.json();

    // Validate required fields
    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ 
        error: 'Name and description are required' 
      }, { status: 400 });
    }

    // Build comprehensive prompt for AI generation
    let fullPrompt = description.trim();
    
    // Add challenge context
    if (challengeTheme) {
      fullPrompt += ` Theme: ${challengeTheme}.`;
    }
    
    if (mainItem) {
      fullPrompt += ` Focus on: ${mainItem}.`;
    }
    
    // Add additional details
    if (promptRaw?.trim()) {
      fullPrompt += ` Additional details: ${promptRaw.trim()}.`;
    }
    
    if (color?.trim()) {
      fullPrompt += ` Color/Pattern: ${color.trim()}.`;
    }
    
    if (style?.trim()) {
      fullPrompt += ` Style: ${style.trim()}.`;
    }

    // Add quality modifiers for challenge submissions
    fullPrompt += ' High-quality fashion design, professional presentation, detailed clothing item.';

    // For now, we'll create a placeholder clothing item
    // In a real implementation, you'd call your AI image generation service here
    const placeholderImageUrl = `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(name.slice(0, 20))}`;

    // Create clothing item
    const clothingItem = await prisma.clothingItem.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        itemType: itemType || 'tops',
        imageUrl: placeholderImageUrl,
        frontImage: placeholderImageUrl,
        promptRaw: fullPrompt,
        promptSanitized: fullPrompt, // In real implementation, you'd sanitize this
        color: color?.trim() || null,
        style: style?.trim() || null,
        isPublished: true, // Challenge submissions are automatically published
        isFeatured: false,
        status: 'CONCEPT', // Challenge submissions start as concepts
        creator: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({
      success: true,
      clothingItem: {
        id: clothingItem.id,
        name: clothingItem.name,
        description: clothingItem.description,
        itemType: clothingItem.itemType,
        imageUrl: clothingItem.imageUrl,
        color: clothingItem.color,
        style: clothingItem.style,
        createdAt: clothingItem.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating challenge design:', error);
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    );
  }
} 