export const PLANS = {
  free: {
    id: "free",
    name: "Gratuito",
    priceMonthly: 0,
    creditsMonthly: 10,
    templatesLimit: 1,
    brandDna: false,
    library: false,
    teamSeats: 1,
    prioritySupport: false,
    apiAccess: false,
    paddleProductId: process.env.PADDLE_PRODUCT_FREE ?? "pri_free",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 4900,
    creditsMonthly: 200,
    templatesLimit: -1,
    brandDna: true,
    library: true,
    teamSeats: 3,
    prioritySupport: false,
    apiAccess: false,
    paddleProductId: process.env.PADDLE_PRODUCT_PRO ?? "pri_pro",
  },
  church: {
    id: "church",
    name: "Igreja",
    priceMonthly: 14900,
    creditsMonthly: 1000,
    templatesLimit: -1,
    brandDna: true,
    library: true,
    teamSeats: 10,
    prioritySupport: true,
    apiAccess: true,
    paddleProductId: process.env.PADDLE_PRODUCT_CHURCH ?? "pri_church",
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

export function getPlan(planId: string): Plan {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

export function getPlanByPaddleProductId(productId: string): Plan | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.paddleProductId === productId) return plan;
  }
  return null;
}

export const CREDIT_COSTS = {
  generation: 1,
  extraction: 0,
} as const;