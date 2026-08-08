import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Tag, Link, AlertCircle, Check, Calendar, Building2 } from 'lucide-react';
import { Customer, Project, TaskCategory, TaskPriority, TaskStatus, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WorkLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logData: Partial<WorkLog>) => void;
  initialData?: WorkLog | null;
  projects: Project[];
  customers?: Customer[];
}

export const WorkLogFormModal: React.FC<WorkLogFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  projects,
  customers = [],
}) => {
  const { t } = useLanguage();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>('Frontend');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [status, setStatus] = useState<TaskStatus>('completed');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [customerId, setCustomerId] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [outcomeLink, setOutcomeLink] = useState<string>('');

  const [isAiEnhancing, setIsAiEnhancing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTitle(initialData.title || '');
      setCategory(initialData.category || 'Frontend');
      setDurationMinutes(initialData.durationMinutes || 60);
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '10:00');
      setStatus(initialData.status || 'completed');
      setPriority(initialData.priority || 'medium');
      setProjectId(initialData.projectId || projects[0]?.id || '');
      setCustomerId(initialData.customerId || '');
      setTags(initialData.tags || []);
      setNotes(initialData.notes || '');
      setOutcomeLink(initialData.outcomeLink || '');
    } else {
      // Reset form defaults for new log
      setDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setCategory('Frontend');
      setDurationMinutes(60);
      setStartTime('09:00');
      setEndTime('10:00');
      setStatus('completed');
      setPriority('medium');
      setProjectId(projects[0]?.id || '');
      setCustomerId('');
      setTags([]);
      setNotes('');
      setOutcomeLink('');
    }
    setAiError(null);
  }, [initialData, isOpen, projects]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // AI Refine & Polish
  const handleAiEnhance = async () => {
    const textToAnalyze = title.trim() || notes.trim();
    if (!textToAnalyze) {
      setAiError('Please type a draft title or note first before asking AI to refine.');
      return;
    }

    setIsAiEnhancing(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/enhance-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: textToAnalyze }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to refine task with AI');
      }

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category as TaskCategory);
      if (data.estimatedMinutes) setDurationMinutes(data.estimatedMinutes);
      if (data.priority) setPriority(data.priority as TaskPriority);
      if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
        // Merge tags
        const newTags = Array.from(new Set([...tags, ...data.suggestedTags.map((t: string) => t.toLowerCase())]));
        setTags(newTags);
      }
      if (data.notes) setNotes(data.notes);
    } catch (err: any) {
      console.error('AI Enhance error:', err);
      setAiError(err.message || 'Error communicating with Gemini AI server.');
    } finally {
      setIsAiEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title.');
      return;
    }

    onSave({
      date,
      title: title.trim(),
      category,
      durationMinutes: Number(durationMinutes) || 30,
      startTime,
      endTime,
      status,
      priority,
      projectId,
      customerId: customerId || undefined,
      tags,
      notes: notes.trim(),
      outcomeLink: outcomeLink.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {initialData ? t('editWorkLog') : t('newWorkLog')}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">{t('appSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Polish Banner */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs">AI Refine & Format</span>
          </div>
          <button
            type="button"
            onClick={handleAiEnhance}
            disabled={isAiEnhancing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            {isAiEnhancing ? (
              <span>{t('generating')}</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Refine</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Row 1: Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('taskTitle')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskTitlePlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              required
            />
          </div>

          {/* Row 2: Date & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('date')}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('customerClient')}</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              >
                <option value="">-- {t('noCustomer')} --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Category, Duration, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="Design/UI">Design/UI</option>
                <option value="Bug Fix">Bug Fix</option>
                <option value="Code Review">Code Review</option>
                <option value="Meeting/Sync">Meeting/Sync</option>
                <option value="DevOps/CI-CD">DevOps/CI-CD</option>
                <option value="Documentation">Documentation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('duration')} ({t('minutes')})</span>
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              >
                <option value="completed">{t('completed')}</option>
                <option value="in_progress">{t('inProgress')}</option>
                <option value="blocked">{t('blocked')}</option>
                <option value="planned">{t('planned')}</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('tags')}</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder={t('tagsPlaceholder')}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all border border-slate-200"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-600 text-slate-400 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes / Technical Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('detailedNotes')}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Outcome Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('outcomeLink')}</span>
            </label>
            <input
              type="url"
              value={outcomeLink}
              onChange={(e) => setOutcomeLink(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-xs pt-3 pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-slate-100 flex items-center justify-end gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveEntry')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
