// app/plushies/[id]/head.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/plushies/${params.id}`,
    { cache: 'no-store' }
  )
  if (!res.ok) {
    return { title: 'Plushie not found' }
  }
  const { plushie } = await res.json()
  const title       = plushie.name
  const description = plushie.description || `${title} plushie`
  const url         = `${process.env.NEXT_PUBLIC_SITE_URL}/plushies/${params.id}`
  const image       = plushie.imageUrl

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Ploosh',
      images: [{ url: image, width: 800, height: 800, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
