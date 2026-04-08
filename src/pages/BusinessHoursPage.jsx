import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Clock, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Puerto_Rico', 'UTC', 'Europe/London'];
const DEFAULT_SCHEDULE = Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: d === 'saturday' || d === 'sunday' }]));

export default function BusinessHoursPage() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState({ schedule: DEFAULT_SCHEDULE, timezone: 'America/New_York', outside_hours_message: '', holidays: [], is_active: true });
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', label: '' });
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['biz-hours', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.BusinessHours.filter({ brand_id: activeBrandId }) : base44.entities.BusinessHours.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setForm({ schedule: s.schedule || DEFAULT_SCHEDULE, timezone: s.timezone || 'America/New_York', outside_hours_message: s.outside_hours_message || '', holidays: s.holidays || [], is_active: s.is_active !== false });
    }
  }, [settings]);

  const save = async () => {
    const payload = { ...form, brand_id: activeBrandId };
    if (settingsId) await base44.entities.BusinessHours.update(settingsId, payload);
    else { const c = await base44.entities.BusinessHours.create(payload); setSettingsId(c.id); }
    qc.invalidateQueries({ queryKey: ['biz-hours', activeBrandId] });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updateDay = (day, field, val) => setForm(f => ({ ...f, schedule: { ...f.schedule, [day]: { ...f.schedule[day], [field]: val } } }));
  const addHoliday = () => {
    if (!newHoliday.date) return;
    setForm(f => ({ ...f, holidays: [...(f.holidays || []), newHoliday] }));
    setNewHoliday({ date: '', label: '' });
  };
  const removeHoliday = (i) => setForm(f => ({ ...f, holidays: f.holidays.filter((_, idx) => idx !== i) }));

  // Is currently open?
  const now = new Date();
  const dayName = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const todaySchedule = form.schedule[dayName] || {};
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isOpen = !todaySchedule.closed && currentTime >= (todaySchedule.open || '09:00') && currentTime <= (todaySchedule.close || '18:00');

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-600" /> Business Hours
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOpen ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isOpen ? 'Open Now' : 'Closed Now'}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Timezone */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Timezone</label>
          <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
            {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
          </select>
        </div>

        {/* Weekly schedule */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Weekly Schedule</h3>
          <div className="space-y-3">
            {DAYS.map(day => {
              const d = form.schedule[day] || { open: '09:00', close: '18:00', closed: false };
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24 shrink-0">
                    <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input type="checkbox" checked={!d.closed} onChange={e => updateDay(day, 'closed', !e.target.checked)} className="accent-violet-600 w-4 h-4" />
                    <span className="text-xs text-gray-500">Open</span>
                  </label>
                  {!d.closed ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={d.open || '09:00'} onChange={e => updateDay(day, 'open', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                      <span className="text-gray-400 text-xs">to</span>
                      <input type="time" value={d.close || '18:00'} onChange={e => updateDay(day, 'close', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Closed all day</span>
                  )}
                  {day === dayName && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Today</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Outside hours message */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Outside Hours Auto-Reply Message</label>
          <p className="text-[11px] text-gray-400 mb-2">Sent when a customer messages outside your business hours. Use {'{'}business_hours{'}'} as a placeholder.</p>
          <textarea value={form.outside_hours_message} onChange={e => setForm(f => ({ ...f, outside_hours_message: e.target.value }))}
            rows={3} placeholder="We are currently closed. Our hours are Monday–Friday 9am–6pm ET. We'll respond as soon as we open!"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
        </div>

        {/* Holidays */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-3">Holiday Schedule</h3>
          <div className="flex gap-2 mb-3">
            <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <input value={newHoliday.label} onChange={e => setNewHoliday(h => ({ ...h, label: e.target.value }))}
              placeholder="Holiday name" className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <button onClick={addHoliday} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {(form.holidays || []).map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
                <span className="text-sm text-gray-700">{h.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{h.date}</span>
                  <button onClick={() => removeHoliday(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Business Hours'}
        </button>
      </div>
    </div>
  );
}