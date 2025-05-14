// app/user/[profile]/page.jsx
import { prisma } from '@/lib/prisma';
import PlushieCard from '@/components/plushie/PlushieCard';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  return {
    title: `${params.profile}'s Plushies`,
  };
}

export default async function UserProfilePage({ params }) {
const user = await prisma.user.findUnique({
  where: { displayName: params.profile },
  include: {
    plushies: {
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    },
  },
});

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Oops!</h1>
          <p className="text-gray-600">User not found.</p>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || 'Anonymous';
  const photoURL = user.image || '/images/profile-placeholder.png';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <Image
            src={photoURL}
            alt={`${displayName}'s profile picture`}
            width={128}
            height={128}
            className="rounded-full object-cover border border-gray-200"
          />
          <div className="mt-4 md:mt-0">
            <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
            <p className="text-gray-600 mt-2">
              These are {displayName}&apos;s published plushie designs!
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6">
          <Link
            href="/discover"
            className="inline-flex items-center border border-green-400 text-green-500 px-6 py-2 rounded-full font-semibold hover:bg-green-50 transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Link>
        </div>

        {/* Published Plushies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
          {user.plushies.length > 0 ? (
            user.plushies.map((plushie) => (
              <PlushieCard key={plushie.id} plushie={plushie} />
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No published plushies yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
