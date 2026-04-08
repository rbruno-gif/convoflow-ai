import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { AlertTriangle, UserCheck, CheckCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function Flagged() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { activeBrandId } = useBrand();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_time', 100)
      : base44.entities.Conversation.list('-last_message_time', 100),
    refetchInterval: 10000,
  });

  const flagged = conversations.filter(c => c.status === 'flagged' || c.status === 'human_requested');

  const handle = async (id, data, msg) => {
    await base44.entities.Conversation.update(id, data);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    toast({ title: msg });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Flagged Conversations</h1>
          <p className="text-sm text-muted-foreground">{flagged.length} conversation{flagged.length !== 1 ? 's' : ''} need attention</p>
        </div>
      </div>

      {flagged.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">All clear! No flagged conversations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flagged.map(c => (
            <Card key={c.id} className="border-0 shadow-sm border-l-4 border-l-orange-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {c.customer_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.customer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.last_message}</p>
                      {c.flagged_reason && (
                        <p className="text-xs text-orange-600 mt-1">⚠ {c.flagged_reason}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {c.status === 'human_requested' ? '🙋 Customer requested human' : '🚩 Flagged'}
                        {c.last_message_time && ` · ${formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/conversations?id=${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        <MessageSquare className="w-3 h-3 mr-1" /> Open
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handle(c.id, { mode: 'human', status: 'active' }, 'Taken over by agent')}
                    >
                      <UserCheck className="w-3 h-3 mr-1" /> Take Over
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handle(c.id, { status: 'resolved' }, 'Resolved')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}