// app/admin/users/page.js

// ensure this route is always dynamic and never cached
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import React from 'react'
import UsersAdminClient from './UsersAdminClient'
import { prisma } from '@/lib/prisma';

export default async function UsersAdminPage({ searchParams: searchParamsPromise }) {
  // await the searchParams promise itself
  const searchParams = await searchParamsPromise

  // now you can safely read q and page
  const searchQuery = searchParams.q ?? ''
  const page = parseInt(searchParams.page ?? '1', 10) || 1

  const pageSize = 10
  const skip = (page - 1) * pageSize

  // grab counts & page of users
  const total = await prisma.user.count({
    where: { email: { contains: searchQuery } },
  })
  const users = await prisma.user.findMany({
    where: { email: { contains: searchQuery } },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  })

  return (
    <UsersAdminClient
      initialUsers={users}
      currentPage={page}
      pageSize={pageSize}
      totalCount={total}
      searchQuery={searchQuery}
    />
  )
}
