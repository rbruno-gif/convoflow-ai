import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function CampaignBuilder({ brandId, campaign, onClose, onSuccess }) {
  const [step, setStep] = useState(1);

  const steps = [
    { number: 1, label: 'Audience' },
    { number: 2, label: 'Channel & Message' },
    { number: 3, label: 'Schedule' },
    { number: 4, label: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= s.number
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s.number}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 w-12 ${step > s.number ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-semibold">{steps[step - 1].label}</p>
        </div>

        {/* Content */}
        <Card className="p-8">
          <p className="text-muted-foreground">
            Campaign builder step {step}: {steps[step - 1].label}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            To be implemented: audience filters, channel selection, message composer, schedule picker, review summary
          </p>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={onSuccess} className="gap-2">
                Schedule Campaign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}