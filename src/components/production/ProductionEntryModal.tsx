import React, { useState, useEffect } from 'react';
import { X, Hammer, AlertCircle } from 'lucide-react';
import { WorkOrder, Machine, Profile, ShiftType } from '../../types';
import { mesApi } from '../../services/mesApi';

interface ProductionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedWorkOrder?: WorkOrder | null;
  workOrders: WorkOrder[];
  machines: Machine[];
  profiles: Profile[];
  currentUserId?: string;
}

export const ProductionEntryModal: React.FC<ProductionEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedWorkOrder,
  workOrders,
  machines,
  profiles,
  currentUserId
}) => {
  const [selectedWoId, setSelectedWoId] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('');
  const [producedQuantity, setProducedQuantity] = useState<number>(0);
  const [rejectedQuantity, setRejectedQuantity] = useState<number>(0);
  const [shift, setShift] = useState<ShiftType>('Shift A (Morning)');
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeOrders = workOrders.filter(w => w.status === 'Pending' || w.status === 'In Progress');

  useEffect(() => {
    if (preselectedWorkOrder) {
      setSelectedWoId(preselectedWorkOrder.id);
      setMachineId(preselectedWorkOrder.machine_id || '');
      setOperatorId(preselectedWorkOrder.operator_id || currentUserId || '');
    } else if (activeOrders.length > 0) {
      const defaultWo = activeOrders[0];
      setSelectedWoId(defaultWo.id);
      setMachineId(defaultWo.machine_id || '');
      setOperatorId(defaultWo.operator_id || currentUserId || '');
    }
    setProducedQuantity(0);
    setRejectedQuantity(0);
    setShift('Shift A (Morning)');
    setProductionDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setError(null);
  }, [preselectedWorkOrder, isOpen, activeOrders.length]);

  const handleWoChange = (woId: string) => {
    setSelectedWoId(woId);
    const wo = workOrders.find(w => w.id === woId);
    if (wo) {
      if (wo.machine_id) setMachineId(wo.machine_id);
      if (wo.operator_id) setOperatorId(wo.operator_id);
    }
  };

  const selectedWo = workOrders.find(w => w.id === selectedWoId);
  const remainingInWo = selectedWo 
    ? Math.max(0, selectedWo.planned_quantity - selectedWo.produced_quantity - selectedWo.rejected_quantity)
    : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWoId) {
      setError('Please select a valid work order.');
      return;
    }
    if (producedQuantity < 0 || rejectedQuantity < 0) {
      setError('Quantities cannot be negative.');
      return;
    }
    if (producedQuantity === 0 && rejectedQuantity === 0) {
      setError('At least Produced Quantity or Rejected Quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await mesApi.createProductionEntry({
        work_order_id: selectedWoId,
        machine_id: machineId || null,
        operator_id: operatorId || null,
        produced_quantity: Number(producedQuantity),
        rejected_quantity: Number(rejectedQuantity),
        shift,
        production_date: productionDate,
        remarks: remarks.trim() || null
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record production entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[30px] bg-blue-50 text-blue-600 border border-blue-100">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 font-display">Record Production Entry</h3>
              <p className="text-xs text-slate-500 font-sans font-normal">Log finished goods, shift scrap, and machine output</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[30px] hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 font-sans">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Work Order Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Work Order <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedWoId}
              onChange={(e) => handleWoChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-colors cursor-pointer"
            >
              {activeOrders.length === 0 ? (
                <option value="">No active work orders available</option>
              ) : (
                activeOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.work_order_number} - {wo.product_name} (Remaining: {Math.max(0, wo.planned_quantity - wo.produced_quantity - wo.rejected_quantity)} of {wo.planned_quantity})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Order Snapshot Pill */}
          {selectedWo && (
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Target:</span>{' '}
                <span className="font-medium text-slate-900 font-mono tabular-nums">{selectedWo.planned_quantity}</span>
              </div>
              <div>
                <span className="text-slate-500">Produced:</span>{' '}
                <span className="font-medium text-emerald-600 font-mono tabular-nums">{selectedWo.produced_quantity}</span>
              </div>
              <div>
                <span className="text-slate-500">Scrapped:</span>{' '}
                <span className="font-medium text-rose-600 font-mono tabular-nums">{selectedWo.rejected_quantity}</span>
              </div>
              <div>
                <span className="text-slate-500">Pending:</span>{' '}
                <span className="font-medium text-amber-600 font-mono tabular-nums">{remainingInWo}</span>
              </div>
            </div>
          )}

          {/* Quantities Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-emerald-700 mb-1">
                Produced Qty (Passed Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={producedQuantity}
                onChange={(e) => setProducedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-emerald-50/40 border border-emerald-300 rounded-[30px] text-sm font-mono text-emerald-700 focus:outline-none focus:border-emerald-500 focus:bg-white tabular-nums transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-rose-700 mb-1">
                Rejected / Scrap Qty <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={rejectedQuantity}
                onChange={(e) => setRejectedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-rose-50/40 border border-rose-300 rounded-[30px] text-sm font-mono text-rose-700 focus:outline-none focus:border-rose-500 focus:bg-white tabular-nums transition-colors font-medium"
              />
            </div>
          </div>

          {/* Shift & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Production Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Shift A (Morning)">Shift A (Morning - 06:00 to 14:00)</option>
                <option value="Shift B (Evening)">Shift B (Evening - 14:00 to 22:00)</option>
                <option value="Shift C (Night)">Shift C (Night - 22:00 to 06:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date of Production</label>
              <input
                type="date"
                required
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition-colors"
              />
            </div>
          </div>

          {/* Machine & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Machine</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">Unassigned</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Operator</label>
              <select
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">Select Operator</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Shift Notes / Tooling Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Standard run rate. 2 scrap parts caused by initial warm-up trim."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-[30px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || activeOrders.length === 0}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-[30px] transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? 'Updating MES...' : 'Submit Entry & Recalculate'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
