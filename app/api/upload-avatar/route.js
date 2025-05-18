import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import supabase from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const ext = file.type.split('/')[1];
    const filename = `${session.user.uid}-${Date.now()}.${ext}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    // Update user's image in database
    await prisma.user.update({
      where: { id: session.user.uid },
      data: { image: publicUrl }
    });

    // Update session
    if (typeof session.update === 'function') {
      await session.update({ image: publicUrl });
    }

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 