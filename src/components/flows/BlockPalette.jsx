import { MessageSquare, MousePointerClick, HelpCircle, GitBranch, Zap, Bot, Clock, Shuffle } from 'lucide-react';

const BLOCK_TYPES = [
  { type: 'message', label: 'Message', icon: MessageSquare, color: '#7c3aed', desc: 'Send text, image, video, or card' },
  { type: 'quick_reply', label: 'Quick Reply', icon: MousePointerClick, color: '#3b82f6', desc: 'Show reply buttons' },
  { type: 'user_input', label: 'User Input', icon: HelpCircle, color: '#10b981', desc: 'Ask a question, save answer' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#f59e0b', desc: 'Branch based on conditions' },
  { type: 'action', label: 'Action', icon: Zap, color: '#ec4899', desc: 'Tag, assign, webhook, email' },
  { type: 'ai', label: 'AI Block', icon: Bot, color: '#6366f1', desc: 'Let AI answer freely' },
  { type: 'delay', label: 'Delay', icon: Clock, color: '#6b7280', desc: 'Wait before next message' },
  { type: 'random_split', label: 'A/B Split', icon: Shuffle, color: '#f97316', desc: 'Split traffic for testing' },
];

export default function BlockPalette({ onAdd }) {
  return (
    <div className="w-48 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Blocks</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Click to add to canvas</p>
      </div>
      <div className="p-2 space-y-1.5 flex-1">
        {BLOCK_TYPES.map(({ type, label, icon: Icon, color, desc }) => (
          <button key={type} onClick={() => onAdd(type)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group text-left">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{label}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}