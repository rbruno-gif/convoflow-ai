import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { UserPlus, Mail, Shield, User, CheckCircle, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Agents() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [loading, setLoading] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const qc = useQueryClient();

  const { brands } = useBrand();
  const childBrands = brands.filter(b => b.slug !== 'u2c-group' && !b.is_archived);

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
    setInvitedEmail(email);
    setEmail('');
    setRole('agent');
    setShowInvite(false);
    qc.invalidateQueries({ queryKey: ['users'] });
    setLoading(false);
    setTimeout(() => setInvitedEmail(null), 4000);
  };

  // Toggle brand assignment directly on Brand entity
  const toggleBrandAssignment = async (brand, agentEmail) => {
    const current = brand.assigned_agents || [];
    const updated = current.includes(agentEmail)
      ? current.filter(e => e !== agentEmail)
      : [...current, agentEmail];
    await base44.entities.Brand.update(brand.id, { assigned_agents: updated });
    qc.invalidateQueries({ queryKey: ['brands'] });
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    agent: 'bg-blue-100 text-blue-700',
    user: 'bg-blue-100 text-blue-700',
    supervisor: 'bg-orange-100 text-orange-700',
  };
  const roleLabels = {
    admin: 'Admin',
    user: 'Agent',
    agent: 'Agent',
    supervisor: 'Supervisor',
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members and brand assignments</p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={() => setShowInvite(s => !s)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Invite Agent
          </Button>
        )}
      </div>

      {invitedEmail && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Invitation sent to <strong>{invitedEmail}</strong>
        </div>
      )}

      {showInvite && (
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm">Invite New Agent</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input type="email" placeholder="agent@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              The invited agent will receive an email to set up their account.
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

      <div className="space-y-3">
        {users.map(u => {
          const assignedBrands = childBrands.filter(b => (b.assigned_agents || []).includes(u.email));
          const isExpanded = assigningUser === u.id;

          return (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{u.full_name || 'Unnamed'}</p>
                      {u.email === currentUser?.email && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {u.email}
                    </p>
                  </div>

                  {/* Brand tags */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-xs">
                    {u.role === 'admin' ? (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">All Brands</span>
                    ) : assignedBrands.length === 0 ? (
                      <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Unassigned</span>
                    ) : assignedBrands.map(b => (
                      <span key={b.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ background: b.primary_color || '#7c3aed' }}>
                        {b.name}
                      </span>
                    ))}
                  </div>

                  <Badge className={roleColors[u.role] || 'bg-muted text-muted-foreground'}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                    {roleLabels[u.role] || u.role}
                  </Badge>

                  {currentUser?.role === 'admin' && u.role !== 'admin' && childBrands.length > 0 && (
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1 shrink-0"
                      onClick={() => setAssigningUser(isExpanded ? null : u.id)}>
                      <Building2 className="w-3 h-3" />
                      {isExpanded ? 'Done' : 'Assign'}
                    </Button>
                  )}
                </div>

                {/* Inline brand assignment */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Assign to brands
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {childBrands.map(brand => {
                        const assigned = (brand.assigned_agents || []).includes(u.email);
                        return (
                          <button
                            key={brand.id}
                            onClick={() => toggleBrandAssignment(brand, u.email)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              assigned
                                ? 'text-white border-transparent'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                            style={assigned ? { background: brand.primary_color || '#7c3aed', borderColor: brand.primary_color } : {}}
                          >
                            {assigned && <CheckCircle className="w-3 h-3" />}
                            {brand.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}