'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPlansAndCurrentSubscription();
    }
  }, [status, router]);

  const fetchPlansAndCurrentSubscription = async () => {
    try {
      // This is a placeholder - you'll need to create these API endpoints
      const plansResponse = await fetch('/api/subscription/plans');
      const userResponse = await fetch('/api/subscription/current');
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.plans || []);
      }
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentPlan(userData.plan || 'starter');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgradeLoading(planId);
      
      // Handle free plan (downgrade)
      if (planId === 'starter') {
        // For downgrading to free, we can handle this directly
        // TODO: Add API endpoint to handle subscription cancellation
        alert('Downgrade to free plan - TODO: implement cancellation');
        return;
      }
      
      // For paid plans, use the original create-subscription endpoint
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setUpgradeLoading(null);
    }
  };

  // Fallback plan data
  const fallbackPlans = [
    {
      id: 'starter',
      name: 'starter',
      displayName: 'Starter',
      price: 0,
      monthlyMediumCredits: 120,
      monthlyHighCredits: 5,
      dailyMediumCap: 15,
      dailyHighCap: null,
      editCapPerDesign: 3,
      features: [
        '120 Medium + 5 High credits per month',
        '15 Medium generations per day',
        '3 edits per design'
      ],
      isPopular: false,
      image: '/images/plans/standard_plan.png'
    },
    {
      id: 'creator',
      name: 'creator',
      displayName: 'Creator',
      price: 9,
      monthlyMediumCredits: 250,
      monthlyHighCredits: 20,
      dailyMediumCap: 30,
      dailyHighCap: 6,
      editCapPerDesign: 5,
      features: [
        '250 Medium + 20 High credits per month',
        '30 Medium / 6 High generations per day',
        '5 edits per design'
      ],
      isPopular: true,
      image: '/images/plans/creator_plan.png'
    },
    {
      id: 'pro_creator',
      name: 'pro_creator',
      displayName: 'Creator Pro',
      price: 15,
      monthlyMediumCredits: 500,
      monthlyHighCredits: 40,
      dailyMediumCap: 60,
      dailyHighCap: 10,
      editCapPerDesign: 5,
      features: [
        '500 Medium + 40 High credits per month',
        '60 Medium / 10 High generations per day',
        '5 edits per design'
      ],
      isPopular: false,
      image: '/images/plans/creator_plan_pro.png'
    }
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Unlock unlimited creativity with more credits and enhanced features
          </p>
        </div>

        <div className="mt-16 pt-12 space-y-12 sm:mt-20 sm:pt-8 sm:space-y-0 sm:grid sm:grid-cols-1 sm:gap-12 lg:grid-cols-2 lg:max-w-5xl lg:mx-auto xl:max-w-6xl xl:grid-cols-3">
          {displayPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              onSelect={handleUpgrade}
              loading={upgradeLoading === plan.id}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/credits/boost"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            Or buy credit boosters instead
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, currentPlan, onSelect, loading }) {
  const isCurrentPlan = currentPlan === plan.name;
  
  return (
    <div className={`relative rounded-2xl border h-full flex flex-col ${
      plan.isPopular
        ? 'border-indigo-600 shadow-lg'
        : 'border-gray-200 shadow-sm'
    } bg-white overflow-hidden`}>
      {plan.isPopular && (
        <div className="absolute -top-1 left-0 right-0 mx-auto w-32 z-10">
          <div className="rounded-full bg-indigo-600 py-2 px-4 text-center text-sm font-medium text-white shadow-lg">
            Most Popular
          </div>
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Plan Image */}
        {plan.image && (
          <div className="flex justify-center mb-6 mt-8">
            <div className="relative">
              <img 
                src={plan.image} 
                alt={`${plan.displayName} plan`}
                className="w-50 h-50 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        )}
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
            <span className="ml-2 text-lg font-medium text-gray-500">/month</span>
          </div>
        </div>
        
        <div className="mb-6 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 text-center">Monthly Credits</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{plan.monthlyMediumCredits}</div>
              <div className="text-xs font-medium text-blue-600">Medium</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{plan.monthlyHighCredits}</div>
              <div className="text-xs font-medium text-purple-600">High</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">What's included</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="flex-shrink-0 h-4 w-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          {isCurrentPlan ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-100 text-gray-600 cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : (
            <button
              onClick={() => onSelect(plan.id)}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                plan.isPopular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg disabled:bg-indigo-400'
                  : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg disabled:bg-gray-400'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : plan.price === 0 ? (
                'Downgrade to Free'
              ) : (
                `Upgrade to ${plan.displayName}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 