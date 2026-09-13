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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editMachine ? `Edit Machine: ${editMachine.machine_code}` : 'Register New Machine'}
              </h3>
              <p className="text-xs text-slate-400">Configure factory asset, line assignment, and maintenance</p>
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
                Machine Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editMachine}
                placeholder="e.g. CNC-03"
                value={formData.machine_code}
                onChange={(e) => setFormData({ ...formData, machine_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-60 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Machine Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haas VF-2 5-Axis CNC"
                value={formData.machine_name}
                onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Location</label>
              <input
                type="text"
                placeholder="e.g. Bay A - Station 02"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Last Maintenance Date</label>
              <input
                type="date"
                value={formData.last_maintenance_date}
                onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Asset Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Spindle replaced on 2026-05. Max rpm 12000."
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
              {submitting ? 'Saving...' : editMachine ? 'Update Machine' : 'Register Machine'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
