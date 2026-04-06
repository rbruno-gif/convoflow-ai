import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PlanComparison() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'U2C Blue',
      description: 'Our flagship network experience',
      color: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      monthlyPrices: { starter: 35, mid: 55, unlimited: 75 },
      annualPrices: { starter: 336, mid: 528, unlimited: 720 },
      tiers: [
        {
          name: 'Starter',
          id: 'starter',
          data: '5GB',
          features: ['Unlimited calls & texts', '5GB high-speed data', 'Network priority during peak hours', 'Mobile hotspot included'],
        },
        {
          name: 'Mid',
          id: 'mid',
          data: '25GB',
          features: ['Unlimited calls & texts', '25GB high-speed data', 'Premium network priority', 'Mobile hotspot included', 'Free international texting'],
          recommended: true,
        },
        {
          name: 'Unlimited',
          id: 'unlimited',
          data: 'Unlimited',
          features: ['Unlimited calls & texts', 'Truly unlimited data', 'Highest network priority', 'Mobile hotspot included', 'Free international calls to 200+ countries', '5G access'],
        },
      ],
    },
    {
      name: 'U2C Pink',
      description: 'Value-focused wireless',
      color: 'from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900',
      badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
      monthlyPrices: { starter: 25, mid: 40, unlimited: 60 },
      annualPrices: { starter: 240, mid: 384, unlimited: 576 },
      tiers: [
        {
          name: 'Starter',
          id: 'starter',
          data: '3GB',
          features: ['Unlimited calls & texts', '3GB high-speed data', 'Standard network priority', 'Mobile hotspot included'],
        },
        {
          name: 'Mid',
          id: 'mid',
          data: '12GB',
          features: ['Unlimited calls & texts', '12GB high-speed data', 'Standard network priority', 'Mobile hotspot included', 'Monthly credits'],
          recommended: true,
        },
        {
          name: 'Unlimited',
          id: 'unlimited',
          data: 'Unlimited',
          features: ['Unlimited calls & texts', 'Truly unlimited data', 'Standard network priority', 'Mobile hotspot included', 'Monthly bonus data'],
        },
      ],
    },
    {
      name: 'U2C Red',
      description: 'Premium mobile experience',
      color: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
      monthlyPrices: { starter: 50, mid: 75, unlimited: 99 },
      annualPrices: { starter: 480, mid: 720, unlimited: 950 },
      tiers: [
        {
          name: 'Starter',
          id: 'starter',
          data: '15GB',
          features: ['Unlimited calls & texts', '15GB high-speed data', 'Highest network priority', 'Mobile hotspot included', '5G access'],
        },
        {
          name: 'Mid',
          id: 'mid',
          data: '50GB',
          features: ['Unlimited calls & texts', '50GB high-speed data', 'Highest network priority', 'Mobile hotspot included', '5G access', 'Concierge support', 'Free monthly device protection'],
          recommended: true,
        },
        {
          name: 'Unlimited',
          id: 'unlimited',
          data: 'Unlimited',
          features: ['Unlimited calls & texts', 'Truly unlimited data', 'Highest network priority', 'Mobile hotspot included', '5G access', '24/7 concierge support', 'Premium device protection', 'Priority customer service'],
        },
      ],
    },
  ];

  const getPrice = (plan, tierId) => {
    const prices = isAnnual ? plan.annualPrices : plan.monthlyPrices;
    return prices[tierId];
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-3xl font-bold text-center">Choose Your U2C Plan</h2>
        <p className="text-muted-foreground text-center max-w-2xl">Compare our three brands to find the perfect fit for your needs and budget</p>

        {/* Billing Toggle */}
        <div className="flex items-center gap-4 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition-colors',
              !isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition-colors relative',
              isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Annual
            {isAnnual && <span className="absolute top-0 right-0 text-[10px] bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full transform translate-x-1 -translate-y-1">Save 20%</span>}
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="flex flex-col gap-4">
            {/* Plan Header */}
            <div className={cn('rounded-t-lg p-6 bg-gradient-to-br', plan.color)}>
              <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            {/* Tiers */}
            <div className="flex flex-col gap-3 px-1">
              {plan.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={cn(
                    'border rounded-lg p-4 transition-all hover:shadow-md',
                    tier.recommended ? `border-2 border-primary shadow-lg bg-accent/30` : 'border-border bg-card'
                  )}
                >
                  {tier.recommended && (
                    <Badge className="mb-2 bg-primary text-primary-foreground">
                      <Zap className="w-3 h-3 mr-1" /> Recommended
                    </Badge>
                  )}

                  <div className="mb-3">
                    <h4 className="font-semibold text-base">{tier.name}</h4>
                    <p className="text-2xl font-bold mt-1">
                      ${getPrice(plan, tier.id)}
                      <span className="text-sm text-muted-foreground font-normal">
                        {isAnnual ? '/year' : '/month'}
                      </span>
                    </p>
                    <p className="text-sm text-accent-foreground font-medium mt-1">{tier.data} data</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={tier.recommended ? 'default' : 'outline'}
                    size="sm"
                  >
                    Choose {tier.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-muted-foreground bg-muted p-3 rounded-lg">
        <p>All plans include 24/7 customer support, free number transfer, and BYOP (bring your own phone) options.</p>
      </div>
    </div>
  );
}