// app/clothing/[id]/head.js

export async function generateMetadata({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/clothing/${params.id}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    return { title: 'Clothing Item not found' };
  }

  const { clothingItem } = await res.json();
  if (!clothingItem) {
    return { title: 'Clothing Item data not found' };
  }

  const title       = clothingItem.name;
  const description = clothingItem.description || `${title} - Clothing Item`;
  const url         = `${process.env.NEXT_PUBLIC_SITE_URL}/clothing/${params.id}`;
  const image       = clothingItem.imageUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Clauth',
      images: [
        { url: image, width: 800, height: 800, alt: title }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
