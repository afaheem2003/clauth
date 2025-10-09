import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminWaitlistClient from "./AdminWaitlistClient"

export default async function AdminWaitlistPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect("/login")
  }

  // Get pagination parameters
  const page = parseInt(searchParams?.page) || 1
  const pageSize = parseInt(searchParams?.pageSize) || 10
  const skip = (page - 1) * pageSize

  // Get total count for pagination
  const totalCount = await prisma.waitlistDesignApplication.count()

  // Fetch waitlist entries with pagination
  const waitlistEntries = await prisma.waitlistDesignApplication.findMany({
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      clothingItem: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          itemType: true,
          gender: true,
          description: true,
          frontImage: true,
          backImage: true
        }
      },
      applicant: {
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true
        }
      }
    }
  })

  // Transform data for client component
  const transformedEntries = waitlistEntries.map(entry => ({
    id: entry.id,
    email: entry.applicant.email,
    status: entry.status || 'PENDING',
    reviewedAt: entry.reviewedAt?.toISOString() || null,
    reviewedBy: entry.reviewedBy || null,
    createdAt: entry.createdAt.toISOString(),
    clothingItem: entry.clothingItem ? {
      id: entry.clothingItem.id,
      name: entry.clothingItem.name,
      imageUrl: entry.clothingItem.imageUrl || entry.clothingItem.frontImage,
      itemType: entry.clothingItem.itemType,
      gender: entry.clothingItem.gender,
      description: entry.clothingItem.description
    } : null,
    applicant: {
      id: entry.applicant.id,
      name: entry.applicant.name,
      displayName: entry.applicant.displayName,
      email: entry.applicant.email
    }
  }))

  return (
    <AdminWaitlistClient 
      entries={transformedEntries} 
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
    />
  )
} 