import React, { useState, useEffect } from 'react';
import { X, Cpu, AlertCircle } from 'lucide-react';
import { Machine, MachineStatus } from '../../types';
import { mesApi } from '../../services/mesApi';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (m: Machine) => void;
  editMachine?: Machine | null;
}

export const MachineModal: React.FC<MachineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMachine
}) => {
  const [formData, setFormData] = useState({
    machine_code: '',
    machine_name: '',
    department: 'Machining',
    status: 'Idle' as MachineStatus,
    location: '',
    last_maintenance_date: '',
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editMachine) {
      setFormData({
        machine_code: editMachine.machine_code,
        machine_name: editMachine.machine_name,
        department: editMachine.department,
        status: editMachine.status,
        location: editMachine.location || '',
        last_maintenance_date: editMachine.last_maintenance_date || '',
        remarks: editMachine.remarks || ''
      });
    } else {
      setFormData({
        machine_code: '',
        machine_name: '',
        department: 'Machining',
        status: 'Idle',
        location: '',
        last_maintenance_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
    }
    setError(null);
  }, [editMachine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.machine_code.trim()) {
      setError('Machine code is required.');
      return;
    }
    if (!formData.machine_name.trim()) {
      setError('Machine name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editMachine) {
        const updated = await mesApi.updateMachine(editMachine.id, {
          machine_name: formData.machine_name.trim(),
          department: formData.department.trim(),
          status: formData.status,
          location: formData.location.trim() || null,
          last_maintenance_date: formData.last_maintenance_date || null,
          remarks: formData.remarks.trim() || null
        });
        onSuccess(updated);
      } else {
        const created = await mesApi.createMachine({
          machine_code: formData.machine_code.trim(),
          machine_name: formData.machine_name.trim(),
          department: formData.department.trim(),
          status: formData.status,
          location: formData.location.trim() || null,
          last_maintenance_date: formData.last_maintenance_date || null,
          remarks: formData.remarks.trim() || null
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save machine.');
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
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 font-display">
                {editMachine ? `Edit Machine: ${editMachine.machine_code}` : 'Register New Machine'}
              </h3>
              <p className="text-xs text-slate-500 font-sans font-normal">Configure factory asset, line assignment, and maintenance</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Machine Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editMachine}
                placeholder="e.g. CNC-03"
                value={formData.machine_code}
                onChange={(e) => setFormData({ ...formData, machine_code: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-mono disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Machine Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haas VF-2 5-Axis CNC"
                value={formData.machine_name}
                onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Machining">Machining</option>
                <option value="Forming">Forming</option>
                <option value="Molding">Molding</option>
                <option value="Electronics">Electronics</option>
                <option value="Fabrication">Fabrication</option>
                <option value="Assembly">Assembly</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Operating Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Physical Location</label>
              <input
                type="text"
                placeholder="e.g. Bay A - Station 02"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Last Maintenance Date</label>
              <input
                type="date"
                value={formData.last_maintenance_date}
                onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Remarks / Asset Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Spindle replaced on 2026-05. Max rpm 12000."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-[30px] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : editMachine ? 'Update Machine' : 'Register Machine'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
