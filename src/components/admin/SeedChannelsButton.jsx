import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function SeedChannelsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    try {
      // Get all brands
      const brands = await base44.asServiceRole.entities.Brand.list();

      let totalCreated = 0;
      for (const brand of brands) {
        const response = await base44.functions.invoke('seedDefaultChannels', {
          brandId: brand.id,
        });
        totalCreated += response.created;
      }

      setResult({
        success: true,
        message: `Seeded ${totalCreated} channels across ${brands.length} brands`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSeed}
        disabled={loading}
        variant="outline"
        className="w-full gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        Seed Default Channels
      </Button>

      {result && (
        <div className={`flex gap-3 p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{result.message}</p>
        </div>
      )}
    </div>
  );
}