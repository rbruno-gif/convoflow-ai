import { useState, useRef, useCallback } from 'react';
import { Trash2, Link, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLOCK_COLORS = {
  trigger: '#7c3aed', message: '#3b82f6', quick_reply: '#10b981',
  user_input: '#f59e0b', condition: '#f97316', action: '#ec4899',
  ai: '#6366f1', delay: '#6b7280', random_split: '#f97316',
};

const BLOCK_ICONS = {
  trigger: '⚡', message: '💬', quick_reply: '🖱️', user_input: '❓',
  condition: '🔀', action: '⚙️', ai: '🤖', delay: '⏱️', random_split: '🎲',
};

export default function FlowCanvas({ nodes, edges, selectedNode, onSelectNode, onMoveNode, onConnect, onDeleteNode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    if (e.altKey) { setConnecting(node.id); return; }
    onSelectNode(node);
    setDragging(node.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
    onMoveNode(dragging, Math.max(0, x), Math.max(0, y));
  }, [dragging, pan, zoom, dragOffset, onMoveNode]);

  const handleMouseUp = (e) => {
    if (connecting) {
      const target = e.target.closest('[data-node-id]');
      if (target && target.dataset.nodeId !== connecting) {
        onConnect(connecting, target.dataset.nodeId);
      }
      setConnecting(null);
    }
    setDragging(null);
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
      onSelectNode(null);
    }
  };

  // Draw SVG edges
  const getEdgePath = (source, target) => {
    const sNode = nodes.find(n => n.id === source);
    const tNode = nodes.find(n => n.id === target);
    if (!sNode || !tNode) return '';
    const sx = sNode.x + 90, sy = sNode.y + 45;
    const tx = tNode.x + 90, ty = tNode.y;
    const midY = (sy + ty) / 2;
    return `M ${sx} ${sy} C ${sx} ${midY} ${tx} ${midY} ${tx} ${ty}`;
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-50" style={{ cursor: connecting ? 'crosshair' : 'default' }}>
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white rounded-xl shadow-md border border-gray-100 p-1.5">
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-gray-100 rounded-lg"><ZoomIn className="w-3.5 h-3.5 text-gray-500" /></button>
        <div className="text-center text-[10px] text-gray-400 font-mono px-1">{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-gray-100 rounded-lg"><ZoomOut className="w-3.5 h-3.5 text-gray-500" /></button>
      </div>

      {/* Alt key hint */}
      {connecting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-violet-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
          Click another block to connect
        </div>
      )}

      <div ref={canvasRef}
        className="canvas-bg absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', inset: 0 }}>
          {/* SVG edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa" />
              </marker>
            </defs>
            {edges.map(edge => (
              <path key={edge.id} d={getEdgePath(edge.source, edge.target)}
                stroke="#a78bfa" strokeWidth="2" fill="none" strokeDasharray="0"
                markerEnd="url(#arrowhead)" />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const color = BLOCK_COLORS[node.type] || '#6b7280';
            const isSelected = selectedNode?.id === node.id;
            return (
              <div key={node.id}
                data-node-id={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                className={cn('absolute select-none rounded-xl shadow-md border-2 transition-shadow cursor-grab active:cursor-grabbing', isSelected ? 'shadow-lg' : 'hover:shadow-md')}
                style={{
                  left: node.x, top: node.y, width: 180,
                  borderColor: isSelected ? color : 'transparent',
                  background: 'white',
                  userSelect: 'none',
                }}>
                <div className="px-3 py-2 rounded-t-xl flex items-center gap-2" style={{ background: `${color}15` }}>
                  <span className="text-sm">{BLOCK_ICONS[node.type] || '📦'}</span>
                  <p className="text-xs font-bold truncate flex-1" style={{ color }}>{node.data?.label || node.type}</p>
                  <button onMouseDown={e => { e.stopPropagation(); onDeleteNode(node.id); }}
                    className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded"
                    style={{ opacity: isSelected ? 1 : undefined }}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                <div className="px-3 py-2">
                  {node.type === 'message' && <p className="text-[11px] text-gray-500 line-clamp-2">{node.data?.content || 'No message set'}</p>}
                  {node.type === 'quick_reply' && <div className="flex flex-wrap gap-1">{(node.data?.buttons || []).map((b, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{b}</span>)}</div>}
                  {node.type === 'condition' && <p className="text-[11px] text-gray-500">If {node.data?.field} {node.data?.operator} "{node.data?.value}"</p>}
                  {node.type === 'delay' && <p className="text-[11px] text-gray-500">Wait {node.data?.delay_value} {node.data?.delay_unit}</p>}
                  {node.type === 'action' && <p className="text-[11px] text-gray-500">{node.data?.action_type?.replace(/_/g, ' ')}</p>}
                  {node.type === 'ai' && <p className="text-[11px] text-indigo-400">🤖 AI handles conversation</p>}
                  {node.type === 'random_split' && <p className="text-[11px] text-gray-500">A: {node.data?.split_a}% / B: {node.data?.split_b}%</p>}
                  {node.type === 'user_input' && <p className="text-[11px] text-gray-500">→ saves to: {node.data?.save_to_field}</p>}
                  {node.type === 'trigger' && <p className="text-[11px] text-violet-500">On: {node.data?.trigger_type}</p>}
                </div>
                {/* Connection point */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer hover:scale-125 transition-transform"
                  style={{ background: color }}
                  onMouseDown={e => { e.stopPropagation(); setConnecting(node.id); }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}