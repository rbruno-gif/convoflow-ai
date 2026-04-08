import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BrandingSettings({ brandId, onChangesMade }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Brand & White Label</h2>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Brand Name</label>
          <Input placeholder="e.g., U2C Mobile" onChange={() => onChangesMade()} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" className="w-12 h-10 rounded cursor-pointer" onChange={() => onChangesMade()} />
            <Input readOnly value="#7c3aed" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Custom Domain</label>
          <Input placeholder="support.yourbrand.com" onChange={() => onChangesMade()} />
          <p className="text-xs text-muted-foreground mt-1">Configure DNS CNAME records to enable custom domain</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" onChange={() => onChangesMade()} />
            Hide "Powered by U2C Command Center"
          </label>
        </div>
      </Card>
    </div>
  );
}