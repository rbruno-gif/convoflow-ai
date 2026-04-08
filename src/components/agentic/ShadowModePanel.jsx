import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ShadowModePanel({ actions }) {
  const [feedback, setFeedback] = useState({});
  const qc = useQueryClient();

  const markAction = async (actionId, correct, reason = '') => {
    await base44.entities.AgenticAction.update(actionId, {
      status: correct ? 'approved' : 'rejected',
      approved_at: new Date().toISOString(),
    });

    qc.invalidateQueries({ queryKey: ['agentic-actions'] });
  };

  return (
    <div className="space-y-4">
      {actions.map(action => (
        <div
          key={action.id}
          className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{action.tool_used}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.step} → {action.reasoning}
              </p>
            </div>
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-semibold">
              SHADOW
            </span>
          </div>

          {/* Proposed Action */}
          <div className="bg-white p-3 rounded border text-sm space-y-2">
            <p className="font-medium">Proposed Action:</p>
            {action.output_data && (
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(action.output_data, null, 2)}
              </pre>
            )}
          </div>

          {/* Review */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
              onClick={() => markAction(action.id, true)}
            >
              <CheckCircle className="w-4 h-4" />
              Correct
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => markAction(action.id, false)}
            >
              <X className="w-4 h-4" />
              Incorrect
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}