import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Mail, Shield, User, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Agents() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteAgent = async () => {
    if (!email) return;
    setLoading(true);
    await base44.users.inviteUser(email, role);
    toast({ title: `Invitation sent to ${email}` });
    setEmail('');
    setRole('user');
    setShowInvite(false);
    qc.invalidateQueries({ queryKey: ['users'] });
    setLoading(false);
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    user: 'bg-blue-100 text-blue-700',
    agent: 'bg-blue-100 text-blue-700',
    supervisor: 'bg-orange-100 text-orange-700',
  };

  const roleLabels = {
    admin: 'Admin',
    user: 'Agent',
    agent: 'Agent',
    supervisor: 'Supervisor',
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members who handle live chats</p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={() => setShowInvite(s => !s)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Invite Agent
          </Button>
        )}
      </div>

      {showInvite && (
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm">Invite New Agent</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                   <SelectItem value="agent">Agent (handle chats)</SelectItem>
                   <SelectItem value="supervisor">Supervisor (coach agents)</SelectItem>
                   <SelectItem value="admin">Admin (full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              The invited agent will receive an email to set up their account and log in to the agent inbox.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button size="sm" onClick={inviteAgent} disabled={loading || !email}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <Card key={u.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold text-sm">
                    {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{u.full_name || 'Unnamed'}</p>
                    {u.email === currentUser?.email && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {u.email}
                  </p>
                </div>
                <Badge className={roleColors[u.role] || 'bg-muted text-muted-foreground'}>
                  {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                  {roleLabels[u.role] || u.role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}