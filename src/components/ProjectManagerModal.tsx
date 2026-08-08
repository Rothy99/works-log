import React, { useState } from 'react';
import { X, Plus, Trash2, FolderKanban, Check, Edit2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onDeleteProject: (id: string) => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAddProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Please enter both Project Name and Code abbreviation.');
      return;
    }

    onAddProject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
    });

    setName('');
    setCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Project Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Add New Project Form */}
          <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Create New Project</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Project Name (e.g. Mobile App API)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Code (e.g. API)"
                  maxLength={5}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase font-mono"
                />
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Brand Color</label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project Workspace</span>
            </button>
          </form>

          {/* List of Existing Projects */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Projects ({projects.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                          {p.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
