/* ───────────────────────── app/page.jsx ───────────────────────────── */
import HomeClient     from './HomeClient'
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

/* fallback images that live in /public/images/plushies/… */
const PLACEHOLDERS = [
  '/images/plushies/plushie1.png',
  '/images/plushies/plushie2.png',
  '/images/plushies/plushie3.png',
  '/images/plushies/plushie4.png',
  '/images/plushies/plushie5.png',
  '/images/plushies/plushie6.png',
]

/** convert a list of image paths to “fake” plushie objects */
const makeDummyPlushies = () =>
  PLACEHOLDERS.map((src, i) => ({
    id:          `placeholder-${i}`,
    name:        'Coming soon…',
    imageUrl:    src,
    pledged:     0,
    goal:        50,
    isPublished: true,
  }))

export default async function HomePage () {
  const now        = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1_000)

  /* ── 1) FEATURED ─────────────────────────────────────────────────── */
  let featured = await prisma.plushie.findMany({
    where:   { isPublished: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take:    8,
  })

  /* ── 2) ALMOST-THERE ( ≥ 75 %, < 100 % ) ─────────────────────────── */
  const published = await prisma.plushie.findMany({
    where:  { isPublished: true },
    select: { id:true, name:true, imageUrl:true, pledged:true, goal:true },
  })

  let almostThere = published
    .filter(p => p.goal && p.pledged / p.goal >= 0.75 && p.pledged < p.goal)
    .sort((a,b) => (b.pledged / b.goal) - (a.pledged / a.goal))
    .slice(0, 8)

  /* ── 3) TRENDING (most pre-orders in last hour) ───────────────────── */
  const trendingGroups = await prisma.preorder.groupBy({
    by: ['plushieId'],
    _count: { plushieId: true },
    where:  { createdAt: { gte: oneHourAgo } },
    orderBy: { _count: { plushieId: 'desc' } },
    take: 8,
  })

  const trendingIds = trendingGroups.map(g => g.plushieId)

  let trending = trendingIds.length
    ? await prisma.plushie.findMany({
        where: { id: { in: trendingIds }, isPublished: true },
      })
    : []

  /* ── fall-back: ensure each carousel has something to show ────────── */
  const dummies = makeDummyPlushies()

  if (!featured.length)     featured     = dummies
  if (!almostThere.length)  almostThere  = dummies
  if (!trending.length)     trending     = dummies

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <HomeClient
      featured    ={featured}
      almostThere ={almostThere}
      trending    ={trending}
    />
  )
}
