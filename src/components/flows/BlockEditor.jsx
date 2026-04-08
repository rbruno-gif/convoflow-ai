import { X, Trash2, Plus } from 'lucide-react';

const ACTION_TYPES = ['assign_agent', 'add_tag', 'remove_tag', 'update_field', 'send_email', 'create_ticket', 'add_to_sequence', 'notify_manager', 'fire_webhook'];
const CONDITION_FIELDS = ['tag', 'channel', 'custom_field', 'is_new_subscriber', 'time_of_day', 'brand', 'department', 'last_interaction'];
const DELAY_UNITS = ['minutes', 'hours', 'days'];
const TRIGGER_TYPES = ['keyword', 'subscribe', 'button_click', 'tag_added', 'field_updated', 'schedule', 'webhook', 'page_visit', 'comment'];

export default function BlockEditor({ node, brandId, onChange, onDelete, onClose }) {
  const { type, data } = node;

  const field = (label, key, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={data[key] || ''} placeholder={placeholder}
        onChange={e => onChange({ [key]: e.target.value })}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  );

  const textarea = (label, key, rows = 3, placeholder = '') => (
    <div key={key}>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <textarea rows={rows} value={data[key] || ''} placeholder={placeholder}
        onChange={e => onChange({ [key]: e.target.value })}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
    </div>
  );

  const select = (label, key, options) => (
    <div key={key}>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <select value={data[key] || ''} onChange={e => onChange({ [key]: e.target.value })}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="w-72 shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="font-semibold text-sm text-gray-900 capitalize">{type.replace('_', ' ')} Block</p>
        <div className="flex gap-1">
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {field('Block Label', 'label', 'text', 'e.g. Welcome Message')}

        {type === 'trigger' && <>
          {select('Trigger Type', 'trigger_type', TRIGGER_TYPES)}
          {(data.trigger_type === 'keyword' || !data.trigger_type) && field('Keyword', 'keyword', 'text', 'e.g. hello, cancel, help')}
          {select('Match Type', 'trigger_match', ['exact', 'contains', 'intent'])}
        </>}

        {type === 'message' && <>
          {select('Message Type', 'message_type', ['text', 'image', 'video', 'card'])}
          {textarea('Content', 'content', 4, 'Hi {first_name}! Welcome to {brand_name}...')}
          <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-2">
            <p className="font-semibold mb-1">Merge fields:</p>
            <div className="flex flex-wrap gap-1">
              {['{first_name}', '{brand_name}', '{plan_name}', '{agent_name}'].map(f => (
                <span key={f} className="bg-violet-100 text-violet-700 px-1.5 rounded font-mono">{f}</span>
              ))}
            </div>
          </div>
          {data.message_type === 'image' && field('Image URL', 'image_url', 'url', 'https://...')}
          {data.message_type === 'card' && <>
            {field('Card Title', 'card_title', 'text', 'Card title')}
            {field('Card Button Label', 'card_button', 'text', 'Click here')}
            {field('Card Button URL', 'card_button_url', 'url', 'https://...')}
          </>}
        </>}

        {type === 'quick_reply' && <>
          {textarea('Question', 'question', 2, 'What would you like to do?')}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Reply Buttons (max 5)</label>
            <div className="space-y-2">
              {(data.buttons || ['Option A']).map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <input value={btn} onChange={e => {
                    const btns = [...(data.buttons || [])];
                    btns[i] = e.target.value;
                    onChange({ buttons: btns });
                  }} className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <button onClick={() => onChange({ buttons: (data.buttons || []).filter((_, j) => j !== i) })}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {(data.buttons || []).length < 5 && (
                <button onClick={() => onChange({ buttons: [...(data.buttons || []), `Option ${(data.buttons || []).length + 1}`] })}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800">
                  <Plus className="w-3 h-3" /> Add button
                </button>
              )}
            </div>
          </div>
        </>}

        {type === 'user_input' && <>
          {textarea('Question', 'question', 2, 'What is your account number?')}
          {field('Save to Field (key)', 'save_to_field', 'text', 'account_number')}
          {select('Input Type', 'input_type', ['text', 'number', 'email', 'phone', 'date'])}
        </>}

        {type === 'condition' && <>
          {select('Check Field', 'field', CONDITION_FIELDS)}
          {select('Operator', 'operator', ['equals', 'not_equals', 'contains', 'exists', 'not_exists'])}
          {field('Value', 'value', 'text', 'e.g. VIP, WhatsApp, prepaid')}
        </>}

        {type === 'action' && <>
          {select('Action Type', 'action_type', ACTION_TYPES.map(a => ({ value: a, label: a.replace(/_/g, ' ') })))}
          {field('Value', 'action_value', 'text', 'Tag name, agent email, webhook URL...')}
        </>}

        {type === 'ai' && <>
          {textarea('AI Prompt Hint', 'prompt_hint', 3, 'Optional: guide the AI on what to focus on...')}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <p className="text-xs text-indigo-700 font-semibold mb-1">🤖 AI Block</p>
            <p className="text-[11px] text-indigo-600">The AI will answer using the brand's knowledge base. Flow resumes after AI interaction ends.</p>
          </div>
        </>}

        {type === 'delay' && <>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Wait Duration</label>
            <div className="flex gap-2">
              <input type="number" min="1" value={data.delay_value || 1} onChange={e => onChange({ delay_value: parseInt(e.target.value) || 1 })}
                className="w-20 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <select value={data.delay_unit || 'hours'} onChange={e => onChange({ delay_unit: e.target.value })}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
                {DELAY_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </>}

        {type === 'random_split' && <>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Split Ratio</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Path A (%)</p>
                <input type="number" min="1" max="99" value={data.split_a || 50}
                  onChange={e => { const v = parseInt(e.target.value) || 50; onChange({ split_a: v, split_b: 100 - v }); }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <span className="text-sm text-gray-400 mt-4">/</span>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Path B (%)</p>
                <input type="number" value={data.split_b || 50} readOnly className="w-full text-xs border border-gray-100 bg-gray-50 rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>
          {field('Conversion Goal', 'conversion_goal', 'text', 'e.g. clicked upgrade button')}
        </>}
      </div>
    </div>
  );
}