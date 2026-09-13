import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[30px] bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 font-display">
                {editInspection ? 'Edit Quality Inspection' : 'Log Quality Inspection'}
              </h3>
              <p className="text-xs text-slate-500 font-sans font-normal">Perform QA audit, verify tolerances, and log defect reasons</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[30px] hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
              disabled={!!editInspection}
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-colors cursor-pointer"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Inspected Qty (Sample Size) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={inspectedQuantity}
                onChange={(e) => setInspectedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-sm font-mono text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white tabular-nums transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-rose-700 mb-1">
                Defects / Rejected Qty <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max={inspectedQuantity}
                value={rejectedQuantity}
                onChange={(e) => setRejectedQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-rose-50/40 border border-rose-300 rounded-[30px] text-sm font-mono text-rose-700 focus:outline-none focus:border-rose-500 focus:bg-white tabular-nums transition-colors font-medium"
              />
            </div>
          </div>

          {/* Auto Calculation Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Passed Units:</span>{' '}
              <span className="font-mono font-medium text-emerald-600 text-sm ml-1 tabular-nums">{passedQuantity}</span>
            </div>
            <div>
              <span className="text-slate-500">Defect Rate:</span>{' '}
              <span className={`font-mono font-medium text-sm ml-1 tabular-nums ${defectRate > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {defectRate}%
              </span>
            </div>
          </div>

          {/* Defect Category */}
          {rejectedQuantity > 0 && (
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1">
                Primary Defect Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value as DefectReason)}
                className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-300 rounded-[30px] text-xs text-amber-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors cursor-pointer"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Inspector</label>
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors cursor-pointer"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Inspection Date</label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white font-mono transition-colors"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Inspection Findings &amp; Root Cause</label>
            <textarea
              rows={2}
              placeholder="e.g. Caliper measurement showed +0.08mm deviation on bore diameter."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-[30px] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Recording QA...' : editInspection ? 'Update Inspection' : 'Submit Inspection'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
