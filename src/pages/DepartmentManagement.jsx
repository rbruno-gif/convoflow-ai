import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import DepartmentModal from '@/components/departments/DepartmentModal';

export default function DepartmentManagement() {
  const { activeBrandId } = useBrand();
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const qc = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId }, 'display_order', 100)
      : [],
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId })
      : [],
  });

  const handleDelete = async (deptId) => {
    if (confirm('Deactivate this department? Conversations will remain assigned.')) {
      await base44.entities.Department.update(deptId, { is_active: false });
      qc.invalidateQueries({ queryKey: ['departments', activeBrandId] });
    }
  };

  const getDeptConversationCount = (deptId) => {
    return conversations.filter(c => c.department_id === deptId && c.status !== 'resolved').length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage brand departments and routing</p>
          </div>
          <button
            onClick={() => { setEditingDept(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {departments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <p className="text-sm text-gray-500 mb-4">No departments yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Create First Department
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {departments.map(dept => {
              const openConversations = getDeptConversationCount(dept.id);
              return (
                <div key={dept.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dept.color || '#7c3aed' }} />
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      {dept.is_active ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <div className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Inactive</div>
                      )}
                    </div>
                    {dept.description && (
                      <p className="text-xs text-gray-500 mt-1">{dept.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-[11px]">
                      <span className="text-gray-600"><strong>{openConversations}</strong> open conversations</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingDept(dept); setShowModal(true); }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <DepartmentModal
          brandId={activeBrandId}
          dept={editingDept}
          onClose={() => { setShowModal(false); setEditingDept(null); }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['departments', activeBrandId] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}