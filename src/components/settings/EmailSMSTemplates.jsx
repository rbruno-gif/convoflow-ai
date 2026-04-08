import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, CheckCircle, Mail, MessageSquare } from 'lucide-react';

const EMAIL_CATEGORIES = [
  'ticket_created', 'ticket_updated', 'ticket_resolved', 'csat_survey',
  'welcome', 'business_hours_auto_reply', 'callback_confirmation', 'campaign',
  'agent_assignment', 'escalation'
];

const SMS_CATEGORIES = [
  'ticket_created', 'agent_reply', 'callback_reminder', 'appointment_confirmation',
  'campaign', 'out_of_hours'
];

const MERGE_FIELDS = [
  '{customer_name}', '{ticket_id}', '{brand_name}', '{agent_name}',
  '{business_hours}', '{callback_time}', '{ticket_url}'
];

export default function EmailSMSTemplates({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('email');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email-templates', brandId],
    queryFn: () => brandId
      ? base44.entities.EmailTemplate.filter({ brand_id: brandId })
      : base44.entities.EmailTemplate.list(),
  });

  const { data: smsTemplates = [] } = useQuery({
    queryKey: ['sms-templates', brandId],
    queryFn: () => brandId
      ? base44.entities.SMSTemplate.filter({ brand_id: brandId })
      : base44.entities.SMSTemplate.list(),
  });

  const templates = tab === 'email' ? emailTemplates : smsTemplates;
  const categories = tab === 'email' ? EMAIL_CATEGORIES : SMS_CATEGORIES;

  const handleSaveTemplate = async (templateData) => {
    const entity = tab === 'email' ? 'EmailTemplate' : 'SMSTemplate';
    if (editingTemplate) {
      await base44.entities[entity].update(editingTemplate.id, templateData);
    } else {
      await base44.entities[entity].create({ ...templateData, brand_id: brandId });
    }
    const key = tab === 'email' ? 'email-templates' : 'sms-templates';
    qc.invalidateQueries({ queryKey: [key, brandId] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditingTemplate(null); }, 1500);
  };

  const handleDeleteTemplate = async (templateId) => {
    const entity = tab === 'email' ? 'EmailTemplate' : 'SMSTemplate';
    await base44.entities[entity].delete(templateId);
    const key = tab === 'email' ? 'email-templates' : 'sms-templates';
    qc.invalidateQueries({ queryKey: [key, brandId] });
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email & SMS Templates</h2>
          <p className="text-sm text-gray-500 mt-1">Customize outbound messaging templates</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingTemplate(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setTab('email')}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'email' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4" /> Email Templates ({emailTemplates.length})
        </button>
        <button
          onClick={() => setTab('sms')}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'sms' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> SMS Templates ({smsTemplates.length})
        </button>
      </div>

      {/* Templates Grid */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No templates yet. Create your first {tab} template.</p>
          </div>
        ) : (
          templates.map(template => (
            <TemplateRow
              key={template.id}
              template={template}
              onEdit={() => { setEditingTemplate(template); setShowForm(true); }}
              onDelete={() => handleDeleteTemplate(template.id)}
            />
          ))
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateFormModal
          template={editingTemplate}
          templateType={tab}
          onSave={handleSaveTemplate}
          onClose={() => { setShowForm(false); setEditingTemplate(null); }}
          categories={categories}
          saved={saved}
        />
      )}
    </div>
  );
}

function TemplateRow({ template, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{template.name}</h3>
        <p className="text-xs text-gray-500 mt-1 capitalize">{template.category.replace(/_/g, ' ')}</p>
        {template.subject && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{template.subject}</p>}
      </div>
      <div className="flex gap-2 ml-4 shrink-0">
        <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
          <Edit2 className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function TemplateFormModal({ template, templateType, onSave, onClose, categories, saved }) {
  const [form, setForm] = useState(
    template ? { ...template } : { name: '', category: categories[0], subject: '', body: '' }
  );

  const insertMergeField = (field) => {
    const textarea = document.querySelector('textarea[name="body"]');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = form.body.substring(0, start) + field + form.body.substring(end);
    setForm(f => ({ ...f, body: newBody }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{template ? 'Edit' : 'Create'} {templateType === 'email' ? 'Email' : 'SMS'} Template</h2>
        </div>

        <div className="p-8 space-y-6">
          {/* Name and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Template Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ticket Created Notification"
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject (Email only) */}
          {templateType === 'email' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Subject Line</label>
              <input
                value={form.subject || ''}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ticket #{ticket_id} Created"
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          )}

          {/* Body with Merge Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Message Body</label>
              <div className="flex gap-1 flex-wrap">
                {MERGE_FIELDS.map(field => (
                  <button
                    key={field}
                    onClick={() => insertMergeField(field)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 font-medium"
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              name="body"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Enter your message..."
              rows={8}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">Character count: {form.body.length}</p>
          </div>

          {/* Preview */}
          {form.body && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Preview</p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">{form.body}</div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}