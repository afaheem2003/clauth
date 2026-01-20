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

  // Get total count for pagination (both AI-generated and uploaded designs)
  const [aiCount, uploadedCount] = await Promise.all([
    prisma.waitlistDesignApplication.count(),
    prisma.uploadedDesignWaitlistApplication.count()
  ])
  const totalCount = aiCount + uploadedCount

  // Fetch both types of applications
  const [aiApplications, uploadedApplications] = await Promise.all([
    prisma.waitlistDesignApplication.findMany({
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
            backImage: true,
            quality: true
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
    }),
    prisma.uploadedDesignWaitlistApplication.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        uploadedDesign: {
          select: {
            id: true,
            name: true,
            frontImage: true,
            backImage: true,
            itemType: true,
            gender: true,
            description: true
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
  ])

  // Combine and sort all applications
  const allApplications = [
    ...aiApplications.map(entry => ({
      id: entry.id,
      email: entry.applicant.email,
      status: entry.status || 'PENDING',
      reviewedAt: entry.reviewedAt?.toISOString() || null,
      reviewedBy: entry.reviewedBy || null,
      createdAt: entry.createdAt.toISOString(),
      designType: 'ai-generated',
      clothingItem: entry.clothingItem ? {
        id: entry.clothingItem.id,
        name: entry.clothingItem.name,
        imageUrl: entry.clothingItem.imageUrl || entry.clothingItem.frontImage,
        itemType: entry.clothingItem.itemType,
        gender: entry.clothingItem.gender,
        description: entry.clothingItem.description,
        quality: entry.clothingItem.quality
      } : null,
      applicant: {
        id: entry.applicant.id,
        name: entry.applicant.name,
        displayName: entry.applicant.displayName,
        email: entry.applicant.email
      }
    })),
    ...uploadedApplications.map(entry => ({
      id: entry.id,
      email: entry.applicant.email,
      status: entry.status || 'PENDING',
      reviewedAt: entry.reviewedAt?.toISOString() || null,
      reviewedBy: entry.reviewedBy || null,
      createdAt: entry.createdAt.toISOString(),
      designType: 'uploaded',
      clothingItem: entry.uploadedDesign ? {
        id: entry.uploadedDesign.id,
        name: entry.uploadedDesign.name,
        imageUrl: entry.uploadedDesign.frontImage,
        itemType: entry.uploadedDesign.itemType,
        gender: entry.uploadedDesign.gender,
        description: entry.uploadedDesign.description,
        // No quality field for uploaded designs
      } : null,
      applicant: {
        id: entry.applicant.id,
        name: entry.applicant.name,
        displayName: entry.applicant.displayName,
        email: entry.applicant.email
      }
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Apply pagination to combined results
  const transformedEntries = allApplications.slice(skip, skip + pageSize)

  return (
    <AdminWaitlistClient 
      entries={transformedEntries} 
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
    />
  )
} 