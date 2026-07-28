# Subscription System Implementation

## Overview

This document outlines the comprehensive subscription system implemented for EduGenius AI, supporting both schools and independent users with Stripe payment integration and 7-day free trials.

## Features Implemented

### 1. Database Schema Updates
- Updated `Subscription` model to support both schools and independent users
- Added Stripe integration fields (`stripeSubscriptionId`, `stripeCustomerId`)
- Added trial support (`isTrial`, `trialEndsAt`)
- Added new subscription statuses (`TRIAL`, `TRIAL_EXPIRED`)

### 2. Subscription Service (`src/lib/subscription-service.ts`)
- **SubscriptionService.getSubscriptionStatus()** - Check subscription status for users/schools
- **SubscriptionService.startFreeTrial()** - Start 7-day free trial
- **SubscriptionService.createStripeCustomer()** - Create Stripe customer
- **SubscriptionService.createStripeSubscription()** - Create Stripe subscription
- **SubscriptionService.handleSuccessfulPayment()** - Process successful payments
- **SubscriptionService.cancelSubscription()** - Cancel subscriptions
- **SubscriptionService.hasAccess()** - Check if user has access to features

### 3. Stripe Integration
- **Stripe Configuration** (`src/lib/stripe.ts`)
- **Webhook Handler** (`src/app/api/webhooks/stripe/route.ts`)
- **Checkout Session Creation** (`src/app/api/subscription/create-checkout/route.ts`)
- **Payment Processing** with automatic subscription activation

### 4. API Routes
- `GET /api/subscription/status` - Get current subscription status
- `POST /api/subscription/start-trial` - Start free trial
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### 5. React Components
- **SubscriptionGuard** (`src/components/subscription/subscription-guard.tsx`)
- **useSubscription Hook** (`src/hooks/use-subscription.ts`)
- **Success Page** (`src/app/subscription/success/page.tsx`)
- **Cancel Page** (`src/app/subscription/cancel/page.tsx`)

### 6. Packages Created
- **Basic Package**: $29.99/month, 10 teachers, 100 students
- **Premium Package**: $99.99/month, 100 teachers, 1000 students

## Subscription Logic

### For Schools
1. **School Admin** manages subscription for entire school
2. All teachers and students under the school inherit access
3. Subscription is tied to `schoolId`

### For Independent Users
1. **Independent Teachers** have their own subscription (`userId`)
2. **Independent Students** inherit access from their teacher
3. If no teacher assigned, students can have their own subscription

### Free Trial Logic
1. **7-day trial** starts automatically for new users/schools
2. Trial begins from account creation date
3. After trial expires, premium features are blocked
4. Only one trial per user/school

### Access Control
```typescript
// Check if user has access
const hasAccess = await SubscriptionService.hasAccess(userId, schoolId)

// Get subscription status
const status = await SubscriptionService.getSubscriptionStatus(userId, schoolId)
```

## Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

## Usage Examples

### 1. Protecting Pages with Subscription Guard
```tsx
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'

export default function PremiumPage() {
  return (
    <SubscriptionGuard>
      <div>Premium content here</div>
    </SubscriptionGuard>
  )
}
```

### 2. Using Subscription Hook
```tsx
import { useSubscription } from '@/hooks/use-subscription'

export default function Component() {
  const { subscription, hasAccess, startTrial, createCheckout } = useSubscription()

  if (!hasAccess) {
    return <div>Please upgrade to access this feature</div>
  }

  return <div>Premium content</div>
}
```

### 3. Starting a Trial
```tsx
const handleStartTrial = async () => {
  const success = await startTrial()
  if (success) {
    // Trial started successfully
  }
}
```

### 4. Creating Checkout Session
```tsx
const handleUpgrade = async (packageId: string) => {
  try {
    await createCheckout(packageId)
    // User will be redirected to Stripe Checkout
  } catch (error) {
    console.error('Checkout failed:', error)
  }
}
```

## Stripe Webhook Events Handled

1. **invoice.payment_succeeded** - Activate subscription
2. **invoice.payment_failed** - Deactivate subscription
3. **customer.subscription.deleted** - Cancel subscription
4. **customer.subscription.updated** - Update subscription status

## Migration Script

The `scripts/migrate-existing-subscriptions.ts` script:
1. Creates Basic and Premium packages
2. Identifies existing premium schools (grandfathered)
3. Sets up trials for new independent teachers
4. Handles independent students under teachers

## Database Schema Changes

### Subscription Model Updates
```prisma
model Subscription {
  id              String             @id @default(cuid())
  schoolId        String?            // Optional for independent users
  userId          String?            // For independent user subscriptions
  packageId       String
  paymentMethodId String?
  status          SubscriptionStatus @default(ACTIVE)
  startDate       DateTime
  endDate         DateTime
  amount          Float
  type            String             @default("SUBSCRIPTION")
  paymentMethod   String             @default("MANUAL")
  transactionId   String?
  stripeSubscriptionId String?       // Stripe subscription ID
  stripeCustomerId String?           // Stripe customer ID
  isTrial         Boolean            @default(false)
  trialEndsAt     DateTime?
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  // Relationships
  school        School?        @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user          User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  package       Package        @relation(fields: [packageId], references: [id])
  paymentMethodRef PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  invoices      Invoice[]

  @@map("subscriptions")
}
```

### New Subscription Statuses
```prisma
enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELLED
  EXPIRED
  TRIAL
  TRIAL_EXPIRED
}
```

## Testing

### Test Scenarios
1. ✅ New independent teacher gets 7-day trial
2. ✅ Trial expires after 7 days
3. ✅ Successful payment activates subscription
4. ✅ Failed payment deactivates subscription
5. ✅ Webhook processing works correctly
6. ✅ Access control blocks expired users
7. ✅ School subscriptions cover all users

### Test Commands
```bash
# Run migration
npx tsx scripts/migrate-existing-subscriptions.ts

# Test subscription service
npx tsx scripts/test-subscription-system.ts
```

## Security Considerations

1. **Webhook Verification** - All Stripe webhooks are verified with signature
2. **Access Control** - Subscription status checked on every protected route
3. **Trial Limits** - Only one trial per user/school
4. **Payment Security** - All payments processed through Stripe

## Monitoring and Analytics

The system tracks:
- Subscription status changes
- Trial conversions
- Payment failures
- Feature usage by subscription tier

## Support and Maintenance

1. **Webhook Monitoring** - Monitor webhook delivery in Stripe dashboard
2. **Subscription Health** - Regular checks for expired subscriptions
3. **Customer Support** - Tools to check and modify subscription status
4. **Billing Issues** - Integration with Stripe's billing portal

## Next Steps

1. Set up Stripe account and get API keys
2. Configure webhook endpoints in Stripe dashboard
3. Test payment flows in Stripe test mode
4. Deploy to production with live Stripe keys
5. Monitor subscription metrics and conversions