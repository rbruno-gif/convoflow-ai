import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ReportsExport({ brand }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Reports & Exports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Generate Report</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select metrics and date range to generate PDF or CSV
          </p>
          <Button className="gap-2">
            <Download className="w-4 h-4" /> Generate Report
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Scheduled Reports</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Auto-generate and email reports on a schedule
          </p>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Create Schedule
          </Button>
        </Card>
      </div>
    </div>
  );
}