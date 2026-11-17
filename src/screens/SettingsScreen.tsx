import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentSettings } from '../types/examap';

export const SettingsScreen: React.FC = () => {
  const { settings, examinations, subjects, updateSettings, resetPrototypeData, pushToast } =
    useApp();

  const [form, setForm] = useState<StudentSettings>(settings);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      pushToast('Validation error', 'Full name and email address are required.', 'warning');
      return;
    }
    updateSettings(form);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      student: form,
      examinations,
      subjects,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'examap-preparation-export.json';
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Export downloaded', 'Saved examap-preparation-export.json to your device.');
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="pb-5 border-b border-slate-200">
        <h2 className="font-display text-xl font-bold text-slate-900">Account & Study Settings</h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage your student profile, semester details, daily study availability, and notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Student Profile */}
        <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">Student Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal academic details displayed across your dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                University Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                University / Institution
              </label>
              <input
                type="text"
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Semester Details */}
        <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Semester Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active academic program and semester timeline
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Degree & Specialization
              </label>
              <input
                type="text"
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Semester
              </label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target GPA</label>
              <input
                type="text"
                value={form.targetGpa}
                onChange={(e) => setForm({ ...form, targetGpa: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Daily Study Availability */}
        <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Daily Study Availability
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defaults used when generating weekly study roadmaps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weekday Hours / Day
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="14"
                value={form.weekdayStudyHours}
                onChange={(e) =>
                  setForm({ ...form, weekdayStudyHours: Number(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weekend Hours / Day
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="14"
                value={form.weekendStudyHours}
                onChange={(e) =>
                  setForm({ ...form, weekendStudyHours: Number(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Session Duration
              </label>
              <select
                value={form.preferredSessionMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferredSessionMinutes: Number(e.target.value) as 30 | 45 | 60 | 90,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Peak Focus Window
              </label>
              <select
                value={form.peakFocusWindow}
                onChange={(e) =>
                  setForm({
                    ...form,
                    peakFocusWindow: e.target.value as StudentSettings['peakFocusWindow'],
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Morning (06:00 – 11:00)">Morning (06:00 – 11:00)</option>
                <option value="Afternoon (13:00 – 17:00)">Afternoon (13:00 – 17:00)</option>
                <option value="Evening (18:00 – 22:30)">Evening (18:00 – 22:30)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Notification Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose which reminders appear in your workspace notification center
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                key: 'examCountdowns' as const,
                title: 'Examination countdown alerts',
                desc: 'Remind me when an exam is within 10 days with unstarted high-weightage topics.',
              },
              {
                key: 'dailyStudyReminders' as const,
                title: 'Daily study session reminders',
                desc: 'Surface scheduled planner blocks at the start of your peak focus window.',
              },
              {
                key: 'documentExtractionAlerts' as const,
                title: 'Document extraction verification alerts',
                desc: 'Notify when uploaded question papers finish extracting and require approval.',
              },
              {
                key: 'weeklyReadinessDigest' as const,
                title: 'Weekly readiness summary',
                desc: 'Compile Sunday evening progress across syllabus coverage and practice drills.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="py-3.5 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.notifications[item.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifications: {
                        ...form.notifications,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#0B162C] rounded"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save all preferences
          </button>
        </div>
      </form>

      {/* Account Settings & Data Management */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">Account Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export local preparation records or restore the prototype to its initial state
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export study data (JSON)
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-red-700 font-medium">Restore sample defaults?</span>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPrototypeData();
                  setConfirmReset(false);
                }}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded"
              >
                Confirm Reset
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset prototype data
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
