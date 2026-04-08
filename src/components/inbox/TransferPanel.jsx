import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TransferPanel({
  conversation,
  onClose,
  onTransfer,
}) {
  const [tab, setTab] = useState('agent');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [warmTransfer, setWarmTransfer] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const { activeBrandId } = useBrand();

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Agent.filter({ brand_id: activeBrandId })
      : [],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId })
      : [],
  });

  const handleTransferToAgent = async () => {
    if (!selectedAgent) return;
    setTransferring(true);

    try {
      // Add transfer to history
      const newTransferHistory = [
        ...(conversation.transfer_history || []),
        {
          from_agent_id: conversation.assigned_agent_id,
          to_agent_id: selectedAgent.id,
          handover_note: handoverNote,
          transferred_at: new Date().toISOString(),
        },
      ];

      await base44.entities.Conversation.update(conversation.id, {
        assigned_agent_id: selectedAgent.id,
        transfer_history: newTransferHistory,
      });

      // Create notification for receiving agent
      await base44.entities.Notification.create({
        brand_id: activeBrandId,
        agent_id: selectedAgent.id,
        type: 'conversation_transferred_to_me',
        title: `Conversation from ${conversation.customer_name}`,
        message: handoverNote || 'No handover note provided',
        conversation_id: conversation.id,
      });

      onTransfer();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferToDepartment = async () => {
    if (!selectedDepartment) return;
    setTransferring(true);

    try {
      const newTransferHistory = [
        ...(conversation.transfer_history || []),
        {
          from_agent_id: conversation.assigned_agent_id,
          to_department_id: selectedDepartment.id,
          handover_note: handoverNote,
          transferred_at: new Date().toISOString(),
        },
      ];

      await base44.entities.Conversation.update(conversation.id, {
        department_id: selectedDepartment.id,
        assigned_agent_id: null, // Unassign from current agent
        queue_position: 1, // Enter queue
        transfer_history: newTransferHistory,
      });

      onTransfer();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Transfer Conversation
          </h2>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agent">Transfer to Agent</TabsTrigger>
            <TabsTrigger value="department">Transfer to Department</TabsTrigger>
          </TabsList>

          {/* Transfer to Agent */}
          <TabsContent value="agent" className="space-y-4 mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold ${
                          agent.status === 'available'
                            ? 'text-green-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {agent.current_conversation_count}/{agent.max_concurrent_conversations}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Transfer to Department */}
          <TabsContent value="department" className="space-y-4 mt-4">
            <div className="space-y-2">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDepartment?.id === dept.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                >
                  <p className="font-medium text-sm">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dept.assigned_agents?.length || 0} agents
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Handover Note */}
        <div className="px-4 space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">
              Handover Note (optional)
            </label>
            <Textarea
              value={handoverNote}
              onChange={e => setHandoverNote(e.target.value)}
              placeholder="Add context for the receiving agent..."
              className="h-20"
            />
          </div>

          {/* Warm Transfer Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={warmTransfer}
              onChange={e => setWarmTransfer(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Stay in conversation (warm transfer)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={tab === 'agent' ? handleTransferToAgent : handleTransferToDepartment}
            disabled={!selectedAgent && !selectedDepartment || transferring}
          >
            {transferring ? 'Transferring...' : 'Confirm Transfer'}
          </Button>
        </div>
      </div>
    </div>
  );
}