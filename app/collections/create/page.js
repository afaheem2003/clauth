import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import CollectionCreationFlow from "./CollectionCreationFlow"

export default async function CreateCollectionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-white">
      <CollectionCreationFlow user={session.user} />
    </div>
  )
} 