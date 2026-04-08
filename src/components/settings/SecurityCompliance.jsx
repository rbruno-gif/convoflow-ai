import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SecurityCompliance({ brandId, onChangesMade }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Security & Compliance</h2>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Two-Factor Authentication</label>
          <select onChange={() => onChangesMade()} className="w-full px-3 py-2 border rounded-lg">
            <option>Off</option>
            <option>Optional</option>
            <option>Required for all</option>
            <option>Required for admins only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password Policy</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={() => onChangesMade()} /> Require uppercase
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={() => onChangesMade()} /> Require number
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={() => onChangesMade()} /> Require symbol
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Retention (days)</label>
          <Input type="number" placeholder="0 = keep forever" onChange={() => onChangesMade()} />
        </div>

        <Button className="w-full">Download Customer Data Export</Button>
        <Button variant="destructive" className="w-full">Request Data Deletion</Button>
      </Card>
    </div>
  );
}