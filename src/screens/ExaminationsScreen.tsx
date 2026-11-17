import React, { useState } from 'react';
import { Calendar, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Examination } from '../types/examap';
import { formatShortDate } from '../utils/examMetrics';

interface ExamFormState {
  title: string;
  semester: string;
  university: string;
  examPeriod: string;
  startDate: string;
  endDate: string;
  availableDailyHours: string;
  status: Examination['status'];
  subjectsText: string;
  subjectDatesText: string;
}

const EMPTY_FORM: ExamFormState = {
  title: '',
  semester: 'Semester 5',
  university: 'National Institute of Engineering & Technology',
  examPeriod: '',
  startDate: '2026-12-01',
  endDate: '2026-12-14',
  availableDailyHours: '4',
  status: 'Upcoming',
  subjectsText: '',
  subjectDatesText: '',
};

export const ExaminationsScreen: React.FC = () => {
  const { examinations, addExamination, updateExamination, deleteExamination, navigateTo } =
    useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | Examination['status']>('All');

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (exam: Examination) => {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      semester: exam.semester,
      university: exam.university,
      examPeriod: exam.examPeriod,
      startDate: exam.startDate,
      endDate: exam.endDate,
      availableDailyHours: String(exam.availableDailyHours),
      status: exam.status,
      subjectsText: exam.subjectNames.join(', '),
      subjectDatesText: exam.subjectNames
        .map((s) => `${s}: ${exam.subjectExamDates?.[s] || exam.startDate}`)
        .join('\n'),
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.semester.trim() || !form.university.trim()) {
      setFormError('Please fill in the examination title, semester, and university.');
      return;
    }
    const parsedSubjects = form.subjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedSubjects.length === 0) {
      setFormError('Enter at least one subject name separated by commas.');
      return;
    }

    const hours = Number(form.availableDailyHours);
    if (Number.isNaN(hours) || hours <= 0 || hours > 16) {
      setFormError('Available daily study hours must be between 0.5 and 16.');
      return;
    }

    const subjectExamDates: Record<string, string> = {};
    form.subjectDatesText.split('\n').forEach((line) => {
      const [namePart, datePart] = line.split(':').map((x) => x.trim());
      if (namePart && datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        subjectExamDates[namePart] = datePart;
      }
    });

    const periodLabel =
      form.examPeriod.trim() || `${formatShortDate(form.startDate)} – ${formatShortDate(form.endDate)}`;

    if (editingId) {
      updateExamination({
        id: editingId,
        title: form.title.trim(),
        semester: form.semester.trim(),
        university: form.university.trim(),
        examPeriod: periodLabel,
        startDate: form.startDate,
        endDate: form.endDate,
        availableDailyHours: hours,
        status: form.status,
        subjectNames: parsedSubjects,
        subjectExamDates,
      });
    } else {
      addExamination({
        title: form.title.trim(),
        semester: form.semester.trim(),
        university: form.university.trim(),
        examPeriod: periodLabel,
        startDate: form.startDate,
        endDate: form.endDate,
        availableDailyHours: hours,
        status: form.status,
        subjectNames: parsedSubjects,
        subjectExamDates,
      });
    }
    setModalOpen(false);
  };

  const visibleExams = examinations.filter((e) =>
    filterStatus === 'All' ? true : e.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Examination Profiles</h2>
          <p className="text-sm text-slate-600 mt-1">
            Organize semester examination cycles, subject dates, and daily study bandwidth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Active', 'Upcoming', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterStatus === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add examination
          </button>
        </div>
      </div>

      {/* Examination Cards */}
      {visibleExams.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <p className="text-sm font-medium text-slate-900">No examination profiles match this filter</p>
          <p className="text-xs text-slate-500 mt-1">
            Create a new examination profile or switch to All examinations.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add examination
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visibleExams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`font-medium ${
                          exam.status === 'Active'
                            ? 'text-teal-700'
                            : exam.status === 'Upcoming'
                              ? 'text-blue-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {exam.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{exam.semester}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{exam.availableDailyHours}h / day target</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 mt-1.5">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{exam.university}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(exam)}
                      aria-label={`Edit ${exam.title}`}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(exam.id)}
                      aria-label={`Delete ${exam.title}`}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dates & Period */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Period: <strong className="font-medium text-slate-900">{exam.examPeriod}</strong>
                  </span>
                  <span className="tabular-nums">
                    Window: {formatShortDate(exam.startDate)} to {formatShortDate(exam.endDate)}
                  </span>
                </div>

                {/* Subjects List */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Included Subjects ({exam.subjectNames.length})
                  </p>
                  <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                    {exam.subjectNames.map((subName) => (
                      <div
                        key={subName}
                        className="py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-800 font-medium truncate">{subName}</span>
                        <span className="text-slate-500 tabular-nums shrink-0">
                          {exam.subjectExamDates?.[subName]
                            ? formatShortDate(exam.subjectExamDates[subName])
                            : formatShortDate(exam.startDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                {confirmDeleteId === exam.id ? (
                  <div className="flex items-center gap-2 w-full justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-700 font-medium">
                      Delete this examination?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteExamination(exam.id);
                          setConfirmDeleteId(null);
                        }}
                        className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateTo('subjects')}
                      className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Open subject workspaces
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('planner')}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Plan study schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Examination Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {editingId ? 'Edit Examination Profile' : 'Add New Examination'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Spring Semester End Examinations 2027"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Semester *
                  </label>
                  <input
                    type="text"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="e.g. Semester 5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as Examination['status'] })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  University / Institution *
                </label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Daily Study Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={form.availableDailyHours}
                    onChange={(e) => setForm({ ...form, availableDailyHours: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject Names (comma-separated) *
                </label>
                <input
                  type="text"
                  value={form.subjectsText}
                  onChange={(e) => setForm({ ...form, subjectsText: e.target.value })}
                  placeholder="e.g. Compiler Design, Distributed Systems, Theory of Computation"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optional Subject Exam Dates (one per line: Subject: YYYY-MM-DD)
                </label>
                <textarea
                  rows={3}
                  value={form.subjectDatesText}
                  onChange={(e) => setForm({ ...form, subjectDatesText: e.target.value })}
                  placeholder="Compiler Design: 2026-12-02&#10;Distributed Systems: 2026-12-06"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747]"
                >
                  {editingId ? 'Save Changes' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
