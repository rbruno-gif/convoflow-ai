import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { validateChannelName, normalizeChannelName, channelNameExists } from '@/utils/channelValidator';

export default function CreateChannelPanel({ brandId, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('public');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { data: existingChannels = [] } = useQuery({
    queryKey: ['channels', brandId],
    queryFn: () => base44.entities.Channel.filter({ brand_id: brandId }, 'name', 100),
  });

  const handleCreate = async () => {
    setError('');
    
    // Validate channel name
    const validationError = validateChannelName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedName = normalizeChannelName(name);
    
    // Check for duplicate
    if (channelNameExists(existingChannels, name)) {
      setError('Channel name already exists');
      return;
    }

    setCreating(true);
    try {
      const user = await base44.auth.me();
      const channel = await base44.entities.Channel.create({
        brand_id: brandId,
        name: normalizedName,
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
      setError(error.message || 'Failed to create channel');
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

        {error && (
          <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Channel Name</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">#</span>
            <Input
              placeholder="general"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
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