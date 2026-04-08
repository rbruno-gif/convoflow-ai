import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Clock, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function BusinessHoursSettings() {
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: businessHours } = useQuery({
    queryKey: ['business-hours', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.BusinessHours.filter({ brand_id: activeBrandId }).then(h => h[0])
      : null,
  });

  useEffect(() => {
    if (businessHours) {
      setHours(businessHours);
      setHolidays(businessHours.holidays || []);
    }
  }, [businessHours]);

  const updateDay = (day, field, value) => {
    setHours(h => ({
      ...h,
      [day]: { ...h[day], [field]: value },
    }));
  };

  const save = async () => {
    if (!hours) return;
    const payload = { ...hours, holidays };
    if (hours.id) {
      await base44.entities.BusinessHours.update(hours.id, payload);
    } else {
      await base44.entities.BusinessHours.create({ ...payload, brand_id: activeBrandId });
    }
    qc.invalidateQueries({ queryKey: ['business-hours', activeBrandId] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!hours) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Business Hours & Auto Reply
          </h1>
        </div>
        <Button
          onClick={save}
          className="gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Changes'}
        </Button>
      </div>

      {/* Timezone */}
      <div className="bg-card rounded-lg p-6 mb-6 border">
        <h2 className="font-bold mb-4">Timezone</h2>
        <Select value={hours.timezone} onValueChange={v => setHours(h => ({ ...h, timezone: v }))}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-card rounded-lg p-6 border space-y-4">
        <h2 className="font-bold">Weekly Schedule</h2>

        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="w-24 capitalize font-medium">{day}</div>

            <Toggle
              pressed={hours[day]?.is_open}
              onPressedChange={v => updateDay(day, 'is_open', v)}
              aria-label="Toggle open"
              className="w-12"
            >
              {hours[day]?.is_open ? 'Open' : 'Closed'}
            </Toggle>

            {hours[day]?.is_open && (
              <>
                <Input
                  type="time"
                  value={hours[day]?.open_time || '09:00'}
                  onChange={e => updateDay(day, 'open_time', e.target.value)}
                  className="w-32"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={hours[day]?.close_time || '17:00'}
                  onChange={e => updateDay(day, 'close_time', e.target.value)}
                  className="w-32"
                />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Holidays */}
      <div className="bg-card rounded-lg p-6 border mt-6">
        <h2 className="font-bold mb-4">Holidays</h2>

        <div className="space-y-3">
          {holidays.map((holiday, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
              <Input
                type="date"
                value={holiday.date}
                onChange={e => {
                  const newHolidays = [...holidays];
                  newHolidays[idx].date = e.target.value;
                  setHolidays(newHolidays);
                }}
                className="w-40"
              />
              <Input
                placeholder="Holiday name"
                value={holiday.name}
                onChange={e => {
                  const newHolidays = [...holidays];
                  newHolidays[idx].name = e.target.value;
                  setHolidays(newHolidays);
                }}
                className="flex-1"
              />
              <Input
                placeholder="Custom message"
                value={holiday.custom_message || ''}
                onChange={e => {
                  const newHolidays = [...holidays];
                  newHolidays[idx].custom_message = e.target.value;
                  setHolidays(newHolidays);
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHolidays(holidays.filter((_, i) => i !== idx))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => setHolidays([...holidays, { date: '', name: '', is_open: false }])}
            className="gap-2 w-full"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </Button>
        </div>
      </div>
    </div>
  );
}