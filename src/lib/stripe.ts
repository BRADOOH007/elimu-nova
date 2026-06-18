import Stripe from 'stripe'

// Lazy initialisation — don't throw at build time if key is missing.
// The error will only surface at runtime when Stripe is actually called.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    _stripe = new Stripe(key, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    })
  }
  return _stripe
}

// Backwards-compatible named export — uses lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  return key
}
