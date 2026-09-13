import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { WorkOrder, Profile, DefectReason, QualityInspection } from '../../types';
import { mesApi } from '../../services/mesApi';

interface QualityInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editInspection?: QualityInspection | null;
  workOrders: WorkOrder[];
  profiles: Profile[];
  currentUserId?: string;
}

export const QualityInspectionModal: React.FC<QualityInspectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editInspection,
  workOrders,
  profiles,
  currentUserId
}) => {
  const [workOrderId, setWorkOrderId] = useState<string>('');
  const [inspectedQuantity, setInspectedQuantity] = useState<number>(50);
  const [rejectedQuantity, setRejectedQuantity] = useState<number>(0);
  const [defectReason, setDefectReason] = useState<DefectReason>('Surface defect');
  const [inspectorId, setInspectorId] = useState<string>('');
  const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editInspection) {
      setWorkOrderId(editInspection.work_order_id);
      setInspectedQuantity(editInspection.inspected_quantity);
      setRejectedQuantity(editInspection.rejected_quantity);
      setDefectReason(editInspection.defect_reason || 'Surface defect');
      setInspectorId(editInspection.inspector_id || '');
      setInspectionDate(editInspection.inspection_date);
      setRemarks(editInspection.remarks || '');
    } else {
      setWorkOrderId(workOrders[0]?.id || '');
      setInspectedQuantity(50);
      setRejectedQuantity(0);
      setDefectReason('Surface defect');
      const defaultInspector = profiles.find(p => p.role === 'Quality Inspector')?.id || currentUserId || '';
      setInspectorId(defaultInspector);
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
    }
    setError(null);
  }, [editInspection, isOpen, workOrders, profiles]);

  const passedQuantity = Math.max(0, inspectedQuantity - rejectedQuantity);
  const defectRate = inspectedQuantity > 0 
    ? Math.round((rejectedQuantity / inspectedQuantity) * 1000) / 10 
    : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!workOrderId) {
      setError('Please select a work order to inspect.');
      return;
    }
    if (inspectedQuantity <= 0) {
      setError('Inspected quantity must be greater than zero.');
      return;
    }
    if (rejectedQuantity < 0) {
      setError('Rejected quantity cannot be negative.');
      return;
    }
    if (rejectedQuantity > inspectedQuantity) {
      setError('Rejected quantity cannot exceed inspected quantity.');
      return;
    }

    setSubmitting(true);
    try {
      if (editInspection) {
        await mesApi.updateQualityInspection(editInspection.id, {
          inspected_quantity: Number(inspectedQuantity),
          rejected_quantity: Number(rejectedQuantity),
          defect_reason: rejectedQuantity > 0 ? defectReason : null,
          inspector_id: inspectorId || null,
          inspection_date: inspectionDate,
          remarks: remarks.trim() || null
        });
      } else {
        await mesApi.createQualityInspection({
          work_order_id: workOrderId,
          inspected_quantity: Number(inspectedQuantity),
          rejected_quantity: Number(rejectedQuantity),
          defect_reason: rejectedQuantity > 0 ? defectReason : null,
          inspector_id: inspectorId || null,
          inspection_date: inspectionDate,
          remarks: remarks.trim() || null
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save quality inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editInspection ? 'Edit Quality Inspection' : 'Log Quality Inspection'}
              </h3>
              <p className="text-xs text-slate-400">Perform QA audit, verify tolerances, and log defect reasons</p>
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

          {/* Work Order Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Work Order <span className="text-rose-400">*</span>
            </label>
            <select
              required
              disabled={!!editInspection}
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60"
            >
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.work_order_number} - {wo.product_name} ({wo.status})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Audit Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Inspected Qty (Sample Size) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={inspectedQuantity}
                onChange={(e) => setInspectedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1">
                Defects / Rejected Qty <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max={inspectedQuantity}
                value={rejectedQuantity}
                onChange={(e) => setRejectedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-sm font-mono text-rose-300 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Auto Calculation Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Passed Units:</span>{' '}
              <span className="font-mono font-bold text-emerald-400 text-sm ml-1">{passedQuantity}</span>
            </div>
            <div>
              <span className="text-slate-400">Defect Rate:</span>{' '}
              <span className={`font-mono font-bold text-sm ml-1 ${defectRate > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {defectRate}%
              </span>
            </div>
          </div>

          {/* Defect Category */}
          {rejectedQuantity > 0 && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Primary Defect Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value as DefectReason)}
                className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Surface defect">Surface defect (Scratches, Burr, Pits)</option>
                <option value="Wrong dimension">Wrong dimension (Out of tolerance)</option>
                <option value="Material issue">Material issue (Porosity, Inclusions)</option>
                <option value="Machine error">Machine error (Tool chatter, Thermal drift)</option>
                <option value="Assembly issue">Assembly issue (Misaligned pin, Loose fastener)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Inspector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Inspector</label>
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Inspector</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Inspection Date</label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Inspection Findings &amp; Root Cause</label>
            <textarea
              rows={2}
              placeholder="e.g. Caliper measurement showed +0.08mm deviation on bore diameter."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/20 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Recording QA...' : editInspection ? 'Update Inspection' : 'Submit Inspection'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
