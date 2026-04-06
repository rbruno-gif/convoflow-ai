import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Building2, Users, TrendingUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CompanyOnboardingModal from '@/components/admin/CompanyOnboardingModal';

export default function SuperAdminDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const qc = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: async () => {
      // Get aggregated analytics across all companies
      const allAnalytics = await base44.entities.CompanyAnalytics.list('-date', 100);
      return allAnalytics;
    },
  });

  const totalConversations = analytics.reduce((sum, a) => sum + (a.total_conversations || 0), 0);
  const totalLeads = analytics.reduce((sum, a) => sum + (a.leads_captured || 0), 0);
  const avgAIResolution = companies.length > 0
    ? (analytics.reduce((sum, a) => sum + (a.ai_resolved || 0), 0) / (totalConversations || 1) * 100).toFixed(1)
    : 0;

  const onboardingComplete = () => {
    setShowOnboarding(false);
    qc.invalidateQueries({ queryKey: ['companies'] });
  };

  const planColor = {
    free: 'bg-slate-100 text-slate-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all companies and platform settings</p>
        </div>
        <Button onClick={() => setShowOnboarding(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Onboard Company
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold mt-1">{companies.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold mt-1">{totalConversations}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Captured</p>
                <p className="text-2xl font-bold mt-1">{totalLeads}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Resolution Rate</p>
                <p className="text-2xl font-bold mt-1">{avgAIResolution}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <div>
        <h2 className="text-lg font-bold mb-4">Companies</h2>
        {companies.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
              No companies yet. Start by onboarding your first company.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {companies.map((company) => (
              <Link key={company.id} to={`/super-admin/companies/${company.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {company.logo_url && (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.website}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={planColor[company.plan]}>{company.plan}</Badge>
                        <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <CompanyOnboardingModal onClose={() => setShowOnboarding(false)} onSuccess={onboardingComplete} />
      )}
    </div>
  );
}