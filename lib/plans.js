/**
 * Centralized Plan Configuration
 * Single source of truth for all subscription plan data
 */

// Stripe Price IDs - ONLY defined here
export const STRIPE_PRICE_IDS = {
  CREATOR: 'price_1RX5cMRgxXa12fTw2kN2DeeF',      // $9/month
  CREATOR_PRO: 'price_1RX5cjRgxXa12fTwn1CqVF2v',  // $15/month
};

// Plan configurations - ONLY defined here
export const PLAN_CONFIGS = {
  FREE: {
    id: 'starter',
    name: 'starter', 
    displayName: 'Starter',
    subscriptionType: 'FREE',
    price: 0,
    stripePriceId: null,
    monthlyLowCredits: 200,
    monthlyMediumCredits: 120,
    monthlyHighCredits: 5,
    dailyLowCap: 25,
    dailyMediumCap: 15,
    dailyHighCap: null,
    features: [
      '200 Sketch + 120 Studio + 5 Runway credits per month',
      '25 Sketch / 15 Studio generations per day'
    ],
    isPopular: false,
    image: '/images/plans/standard_plan.png'
  },
  
  CREATOR: {
    id: 'creator',
    name: 'creator',
    displayName: 'Creator',
    subscriptionType: 'CREATOR', 
    price: 9,
    stripePriceId: STRIPE_PRICE_IDS.CREATOR,
    monthlyLowCredits: 400,
    monthlyMediumCredits: 250,
    monthlyHighCredits: 20,
    dailyLowCap: 50,
    dailyMediumCap: 30,
    dailyHighCap: 6,
    features: [
      '400 Sketch + 250 Studio + 20 Runway credits per month',
      '50 Sketch / 30 Studio / 6 Runway generations per day'
    ],
    isPopular: true,
    image: '/images/plans/creator_plan.png'
  },
  
  CREATOR_PRO: {
    id: 'pro_creator',
    name: 'pro_creator',
    displayName: 'Creator Pro',
    subscriptionType: 'CREATOR_PRO',
    price: 15,
    stripePriceId: STRIPE_PRICE_IDS.CREATOR_PRO,
    monthlyLowCredits: 800,
    monthlyMediumCredits: 500,
    monthlyHighCredits: 40,
    dailyLowCap: 100,
    dailyMediumCap: 60,
    dailyHighCap: 10,
    features: [
      '800 Sketch + 500 Studio + 40 Runway credits per month',
      '100 Sketch / 60 Studio / 10 Runway generations per day'
    ],
    isPopular: false,
    image: '/images/plans/creator_plan_pro.png'
  }
};

// Utility functions
export function getPlanByName(planName) {
  const planKey = Object.keys(PLAN_CONFIGS).find(
    key => PLAN_CONFIGS[key].name === planName || PLAN_CONFIGS[key].id === planName
  );
  return planKey ? PLAN_CONFIGS[planKey] : PLAN_CONFIGS.FREE;
}

export function getPlanBySubscriptionType(subscriptionType) {
  const planKey = Object.keys(PLAN_CONFIGS).find(
    key => PLAN_CONFIGS[key].subscriptionType === subscriptionType
  );
  return planKey ? PLAN_CONFIGS[planKey] : PLAN_CONFIGS.FREE;
}

export function getPlanByPriceId(priceId) {
  const planKey = Object.keys(PLAN_CONFIGS).find(
    key => PLAN_CONFIGS[key].stripePriceId === priceId
  );
  return planKey ? PLAN_CONFIGS[planKey] : PLAN_CONFIGS.FREE;
}

export function getAllPlans() {
  return Object.values(PLAN_CONFIGS);
}

export function getPaidPlans() {
  return Object.values(PLAN_CONFIGS).filter(plan => plan.price > 0);
}

// Mapping functions for backward compatibility
export function mapSubscriptionTypeToDisplayName(subscriptionType) {
  const plan = getPlanBySubscriptionType(subscriptionType);
  return plan.displayName;
}

export function mapPlanNameToSubscriptionType(planName) {
  const plan = getPlanByName(planName);
  return plan.subscriptionType;
} 