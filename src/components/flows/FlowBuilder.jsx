import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, CheckCircle, Play, Pause, Plus, ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import FlowCanvas from '@/components/flows/FlowCanvas';
import BlockPalette from '@/components/flows/BlockPalette';
import BlockEditor from '@/components/flows/BlockEditor';

export default function FlowBuilder({ flow, brandId, onBack }) {
  const [nodes, setNodes] = useState(flow.nodes || []);
  const [edges, setEdges] = useState(flow.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [status, setStatus] = useState(flow.status || 'draft');
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(flow.name || 'Untitled Flow');
  const qc = useQueryClient();

  const save = async () => {
    await base44.entities.Flow.update(flow.id, { name, nodes, edges, status, brand_id: brandId });
    qc.invalidateQueries({ queryKey: ['flows', brandId] });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const addNode = (type) => {
    const id = `node_${Date.now()}`;
    const defaults = {
      message: { label: 'Message', content: 'Type your message here...', message_type: 'text' },
      quick_reply: { label: 'Quick Reply', question: 'Choose an option:', buttons: ['Option A', 'Option B'] },
      user_input: { label: 'User Input', question: 'What is your question?', save_to_field: 'user_answer' },
      condition: { label: 'Condition', field: 'tag', operator: 'equals', value: '' },
      action: { label: 'Action', action_type: 'assign_agent', action_value: '' },
      ai: { label: 'AI Block', prompt_hint: 'AI answers using knowledge base' },
      delay: { label: 'Delay', delay_value: 1, delay_unit: 'hours' },
      random_split: { label: 'A/B Split', split_a: 50, split_b: 50 },
      trigger: { label: 'Trigger', trigger_type: 'keyword', keyword: '' },
    };
    const newNode = {
      id, type,
      x: 150 + Math.random() * 200,
      y: 100 + nodes.length * 130,
      data: defaults[type] || { label: type },
    };
    setNodes(n => [...n, newNode]);
    setSelectedNode(newNode);
  };

  const updateNode = (id, data) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode(s => s?.id === id ? { ...s, data: { ...s.data, ...data } } : s);
  };

  const deleteNode = (id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const connectNodes = (sourceId, targetId) => {
    const edgeId = `e_${sourceId}_${targetId}`;
    if (!edges.find(e => e.id === edgeId)) {
      setEdges(es => [...es, { id: edgeId, source: sourceId, target: targetId }]);
    }
  };

  const moveNode = (id, x, y) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, x, y } : n));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <input value={name} onChange={e => setName(e.target.value)}
          className="font-semibold text-gray-900 bg-transparent border-none outline-none text-sm flex-1 min-w-0" />
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize', status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
            {status}
          </span>
          <button onClick={() => setStatus(s => s === 'active' ? 'paused' : 'active')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200')}>
            {status === 'active' ? <><Pause className="w-3 h-3" />Pause</> : <><Play className="w-3 h-3" />Activate</>}
          </button>
          <button onClick={save}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5" />Saved</> : <><Save className="w-3.5 h-3.5" />Save</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Block palette */}
        <BlockPalette onAdd={addNode} />

        {/* Canvas */}
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          onMoveNode={moveNode}
          onConnect={connectNodes}
          onDeleteNode={deleteNode}
        />

        {/* Node editor */}
        {selectedNode && (
          <BlockEditor
            node={selectedNode}
            brandId={brandId}
            onChange={(data) => updateNode(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}