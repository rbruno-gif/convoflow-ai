import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const stepColors = {
  understand: 'bg-blue-100 text-blue-700',
  plan: 'bg-purple-100 text-purple-700',
  execute: 'bg-green-100 text-green-700',
  approval: 'bg-yellow-100 text-yellow-700',
  verify: 'bg-cyan-100 text-cyan-700',
  respond: 'bg-pink-100 text-pink-700',
  log: 'bg-gray-100 text-gray-700',
};

export default function AgenticActionLog({ actions }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-2">
      {actions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border text-muted-foreground">
          <p>No agentic actions yet</p>
        </div>
      ) : (
        actions.map(action => (
          <div key={action.id} className="bg-card border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === action.id ? null : action.id)}
              className="w-full text-left p-4 hover:bg-muted transition-colors flex items-start justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${stepColors[action.step]}`}>
                    {action.step}
                  </span>
                  <span className="text-sm font-medium">{action.tool_used}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      action.status === 'executed' || action.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : action.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {action.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(action.created_date), { addSuffix: true })}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expanded === action.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expanded === action.id && (
              <div className="bg-muted p-4 border-t space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Reasoning</p>
                  <p className="text-sm">{action.reasoning}</p>
                </div>

                {action.input_data && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Input</p>
                    <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(action.input_data, null, 2)}
                    </pre>
                  </div>
                )}

                {action.output_data && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Output</p>
                    <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(action.output_data, null, 2)}
                    </pre>
                  </div>
                )}

                {action.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700">{action.error_message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}