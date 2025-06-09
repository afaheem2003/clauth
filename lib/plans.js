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
  
  CREATOR: {
    id: 'creator',
    name: 'creator',
    displayName: 'Creator',
    subscriptionType: 'CREATOR', 
    price: 9,
    stripePriceId: STRIPE_PRICE_IDS.CREATOR,
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
  
  CREATOR_PRO: {
    id: 'pro_creator',
    name: 'pro_creator',
    displayName: 'Creator Pro',
    subscriptionType: 'CREATOR_PRO',
    price: 15,
    stripePriceId: STRIPE_PRICE_IDS.CREATOR_PRO,
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