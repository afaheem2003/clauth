import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Get all users with their waitlist info, ordered by signup date (earliest first)
  const users = await prisma.user.findMany({
    include: {
      waitlistInfo: true
    },
    orderBy: [
      {
        waitlistInfo: {
          signupDate: 'asc'
        }
      },
      {
        createdAt: 'asc'
      }
    ]
  })

  return <AdminUsersClient users={users} />
} 