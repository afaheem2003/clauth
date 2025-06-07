'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BoostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boosters, setBoosters] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchBoostersAndStats();
    }
  }, [status, router]);

  const fetchBoostersAndStats = async () => {
    try {
      // Fetch usage stats
      const statsResponse = await fetch('/api/usage');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUsageStats(statsData.usage);
      }

      // This is a placeholder - you'll need to create this API endpoint
      const boostersResponse = await fetch('/api/boosters/available');
      if (boostersResponse.ok) {
        const boostersData = await boostersResponse.json();
        setBoosters(boostersData.boosters || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback booster data
  const fallbackBoosters = [
    {
      id: 'medium_micro',
      name: 'medium_micro',
      displayName: 'Starter',
      price: 6,
      mediumCredits: 80,
      highCredits: 0,
      description: 'Perfect for trying new ideas',
      isPopular: false
    },
    {
      id: 'medium_bulk',
      name: 'medium_bulk',
      displayName: 'Creator',
      price: 10,
      mediumCredits: 200,
      highCredits: 0,
      description: 'Most popular for active creators',
      isPopular: true
    },
    {
      id: 'high_micro',
      name: 'high_micro',
      displayName: 'Quality',
      price: 6,
      mediumCredits: 0,
      highCredits: 15,
      description: 'Premium quality generations',
      isPopular: false
    },
    {
      id: 'high_bulk',
      name: 'high_bulk',
      displayName: 'Professional',
      price: 12,
      mediumCredits: 0,
      highCredits: 40,
      description: 'Maximum premium credits',
      isPopular: false
    }
  ];

  const displayBoosters = boosters.length > 0 ? boosters : fallbackBoosters;

  const handlePurchase = async (boosterId) => {
    try {
      setPurchaseLoading(boosterId);
      const response = await fetch('/api/payments/create-booster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterId }),
      });

      const { url, error } = await response.json();
      
      if (error) {
        alert(error);
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Credit Boosters
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Top up your account with additional credits when you need them most.
          </p>
        </div>

        {/* Current Balance */}
        {usageStats && (
          <div className="mt-8 max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Current Balance</h3>
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{usageStats.mediumCredits}</div>
                  <div className="text-sm text-gray-600 mb-2">Medium Credits</div>
                  <div className="text-xs text-gray-500">
                    {usageStats.dailyMediumCap ? `${usageStats.mediumUsedToday}/${usageStats.dailyMediumCap} used today` : 'No daily limit'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{usageStats.highCredits}</div>
                  <div className="text-sm text-gray-600 mb-2">High Credits</div>
                  <div className="text-xs text-gray-500">
                    {usageStats.dailyHighCap ? `${usageStats.highUsedToday}/${usageStats.dailyHighCap} used today` : 'No daily limit'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booster Packs */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
          {displayBoosters.map((booster) => (
            <BoosterCard
              key={booster.id}
              booster={booster}
              onPurchase={handlePurchase}
              loading={purchaseLoading === booster.id}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Link
            href="/credits/upgrade"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            Or view monthly plans instead
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BoosterCard({ booster, onPurchase, loading }) {
  const creditType = booster.mediumCredits > 0 ? 'medium' : 'high';
  const creditAmount = booster.mediumCredits > 0 ? booster.mediumCredits : booster.highCredits;
  
  return (
    <div className={`relative rounded-2xl border ${
      booster.isPopular
        ? 'border-indigo-600 shadow-lg'
        : 'border-gray-200 shadow-sm'
    } bg-white`}>
      {booster.isPopular && (
        <div className="absolute -top-5 left-0 right-0 mx-auto w-32">
          <div className="rounded-full bg-indigo-600 py-1 px-4 text-center text-sm font-medium text-white">
            Most Popular
          </div>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{booster.displayName}</h3>
        <p className="text-sm text-gray-600 mb-6">{booster.description}</p>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Credits</h4>
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${
              creditType === 'medium' ? 'text-blue-600' : 'text-purple-600'
            }`}>
              {creditAmount}
            </div>
            <div className="text-sm text-gray-600">
              {creditType === 'medium' ? 'Medium' : 'High'}
            </div>
          </div>
        </div>
        
        <div className="flex items-baseline mb-8">
          <span className="text-5xl font-bold text-gray-900">${booster.price}</span>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => onPurchase(booster.id)}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              booster.isPopular
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400'
                : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              `Purchase ${booster.displayName}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 