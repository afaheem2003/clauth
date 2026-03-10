import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Get some basic stats
  const totalUsers = await prisma.user.count()
  const waitlistedUsers = await prisma.user.count({
    where: { 
      waitlistStatus: 'WAITLISTED',
      role: 'USER' // Don't count admins as waitlisted
    }
  })
  const approvedUsers = await prisma.user.count({
    where: { 
      OR: [
        { waitlistStatus: 'APPROVED' },
        { role: 'ADMIN' }
      ]
    }
  })

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total Users", value: totalUsers },
          { label: "Waitlisted", value: waitlistedUsers },
          { label: "Approved", value: approvedUsers },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-light text-gray-900">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: "/admin/users", label: "User Management", desc: "Manage users and waitlist status" },
          { href: "/admin/clothing", label: "Clothing Items", desc: "Manage clothing designs and drops" },
          { href: "/admin/production", label: "Production", desc: "Track designs through the pipeline" },
          { href: "/admin/voting", label: "Community Voting", desc: "Schedule and manage voting rounds" },
          { href: "/admin/waitlist", label: "Waitlist", desc: "Review design submissions" },
          { href: "/admin/dashboard", label: "Full Analytics", desc: "Comprehensive stats with charts" },
        ].map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors duration-200 group"
          >
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-black">{label}</h3>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
} 