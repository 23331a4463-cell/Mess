import React, { useState, useEffect } from 'react';
import { X, ClipboardList, AlertCircle } from 'lucide-react';
import { WorkOrder, Machine, Profile, WorkOrderPriority, WorkOrderStatus } from '../../types';
import { mesApi } from '../../services/mesApi';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wo: WorkOrder) => void;
  editOrder?: WorkOrder | null;
  machines: Machine[];
  profiles: Profile[];
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editOrder,
  machines,
  profiles
}) => {
  const [formData, setFormData] = useState({
    work_order_number: '',
    product_name: '',
    product_code: '',
    planned_quantity: 100,
    machine_id: '',
    operator_id: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: 'Medium' as WorkOrderPriority,
    status: 'Pending' as WorkOrderStatus,
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editOrder) {
      setFormData({
        work_order_number: editOrder.work_order_number,
        product_name: editOrder.product_name,
        product_code: editOrder.product_code,
        planned_quantity: editOrder.planned_quantity,
        machine_id: editOrder.machine_id || '',
        operator_id: editOrder.operator_id || '',
        start_date: editOrder.start_date,
        due_date: editOrder.due_date,
        priority: editOrder.priority,
        status: editOrder.status,
        remarks: editOrder.remarks || ''
      });
    } else {
      // Auto-generate a clean WO number
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        work_order_number: `WO-${new Date().getFullYear()}-${randomSeq}`,
        product_name: '',
        product_code: '',
        planned_quantity: 100,
        machine_id: machines[0]?.id || '',
        operator_id: profiles.find(p => p.role === 'Operator')?.id || '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Pending',
        remarks: ''
      });
    }
    setError(null);
  }, [editOrder, isOpen, machines, profiles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Business rule validation
    if (formData.planned_quantity <= 0) {
      setError('Planned quantity must be greater than zero.');
      return;
    }
    if (new Date(formData.due_date) < new Date(formData.start_date)) {
      setError('Due date cannot be earlier than the start date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editOrder) {
        const updated = await mesApi.updateWorkOrder(editOrder.id, {
          product_name: formData.product_name,
          product_code: formData.product_code,
          planned_quantity: Number(formData.planned_quantity),
          machine_id: formData.machine_id || null,
          operator_id: formData.operator_id || null,
          start_date: formData.start_date,
          due_date: formData.due_date,
          priority: formData.priority,
          status: formData.status,
          remarks: formData.remarks || null
        });
        onSuccess(updated);
      } else {
        const created = await mesApi.createWorkOrder({
          work_order_number: formData.work_order_number.trim(),
          product_name: formData.product_name.trim(),
          product_code: formData.product_code.trim(),
          planned_quantity: Number(formData.planned_quantity),
          machine_id: formData.machine_id || null,
          operator_id: formData.operator_id || null,
          start_date: formData.start_date,
          due_date: formData.due_date,
          priority: formData.priority,
          status: formData.status,
          remarks: formData.remarks || null
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save work order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editOrder ? `Edit Work Order #${editOrder.work_order_number}` : 'Create New Work Order'}
              </h3>
              <p className="text-xs text-slate-400">Specify production targets, assignment, and timelines</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Order Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editOrder}
                value={formData.work_order_number}
                onChange={(e) => setFormData({ ...formData, work_order_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PRD-BRK-440"
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Brake Caliper Assembly"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Planned Quantity (Units) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.planned_quantity}
                onChange={(e) => setFormData({ ...formData, planned_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Machine</label>
              <select
                value={formData.machine_id}
                onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassigned</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code} - {m.machine_name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Operator</label>
              <select
                value={formData.operator_id}
                onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as WorkOrderPriority })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkOrderStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Quality tolerance +/- 0.05mm. Inspect first 10 parts."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-600/20 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editOrder ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
