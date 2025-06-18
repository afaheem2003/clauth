import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import AdminWaitlistApplicationsClient from "./AdminWaitlistApplicationsClient"

export default async function AdminWaitlistApplicationsPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect("/login")
  }

  return <AdminWaitlistApplicationsClient />
} 