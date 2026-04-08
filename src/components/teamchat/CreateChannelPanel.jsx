import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateChannelPanel({ brandId, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('public');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const user = await base44.auth.me();
      const channel = await base44.entities.Channel.create({
        brand_id: brandId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        description,
        created_by: user.email,
      });

      // Create welcome message
      await base44.entities.ChannelMessage.create({
        brand_id: brandId,
        channel_id: channel.id,
        sender_id: 'system',
        sender_name: 'System',
        content: `Welcome to #${channel.name}! This channel was created by ${user.full_name}.`,
        is_system: true,
      });

      onSuccess();
    } catch (error) {
      console.error('Create channel error:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Create Channel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Channel Name</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">#</span>
            <Input
              placeholder="general"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Type</label>
          <div className="flex gap-3">
            {['public', 'private'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Description (optional)</label>
          <Input
            placeholder="What is this channel about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create Channel'}
          </Button>
        </div>
      </div>
    </div>
  );
}