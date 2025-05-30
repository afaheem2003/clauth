import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import WardrobeCreationFlow from "./WardrobeCreationFlow"

export default async function CreateWardrobePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-white">
      <WardrobeCreationFlow user={session.user} />
    </div>
  )
} 