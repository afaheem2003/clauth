import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminWaitlistClient from "./AdminWaitlistClient"

export default async function AdminWaitlistPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect("/login")
  }

  // Fetch waitlist entries with new fields
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform data for client component
  const transformedEntries = waitlistEntries.map(entry => ({
    id: entry.id,
    email: entry.email,
    status: entry.status || 'PENDING',
    approvedAt: entry.approvedAt?.toISOString() || null,
    approvedBy: entry.approvedBy || null,
    createdAt: entry.createdAt.toISOString()
  }))

  return <AdminWaitlistClient entries={transformedEntries} />
} 