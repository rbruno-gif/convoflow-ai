import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, AlertCircle, Users, Settings, Trash2, Plus } from 'lucide-react';

const actionIcons = {
  BRAND_CREATED: Plus,
  BRAND_UPDATED: Settings,
  AGENT_INVITED: Users,
  AGENT_DELETED: Trash2,
  SETTINGS_UPDATED: Settings,
};

const actionLabels = {
  BRAND_CREATED: 'Brand created',
  BRAND_UPDATED: 'Brand updated',
  AGENT_INVITED: 'Agent invited',
  AGENT_DELETED: 'Agent deleted',
  SETTINGS_UPDATED: 'Settings updated',
};

export default function ActivityFeed({ activities }) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {activities.map((activity, idx) => {
        const Icon = actionIcons[activity.action_type] || AlertCircle;
        const label = actionLabels[activity.action_type] || activity.action_type;

        return (
          <div key={activity.id} className={`p-4 flex gap-3 ${idx !== activities.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                <strong>{activity.actor_name}</strong> {label}
              </p>
              {activity.target_name && (
                <p className="text-xs text-gray-500">{activity.target_name}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}