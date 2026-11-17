import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckSquare,
  Clock,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudyTask, TopicStatus } from '../types/examap';
import { REFERENCE_TODAY } from '../data/mockData';
import { formatDayMonth, getSubjectTopics } from '../utils/examMetrics';

const WEEK_DAYS = [
  { date: '2026-11-17', label: 'Tue' },
  { date: '2026-11-18', label: 'Wed' },
  { date: '2026-11-19', label: 'Thu' },
  { date: '2026-11-20', label: 'Fri' },
  { date: '2026-11-21', label: 'Sat' },
  { date: '2026-11-22', label: 'Sun' },
  { date: '2026-11-23', label: 'Mon' },
];

export const StudyPlannerScreen: React.FC = () => {
  const {
    subjects,
    studyTasks,
    settings,
    toggleTaskComplete,
    rescheduleTask,
    regenerateStudyPlan,
  } = useApp();

  const [selectedDay, setSelectedDay] = useState<string>(REFERENCE_TODAY);
  const [rescheduleTarget, setRescheduleTarget] = useState<StudyTask | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(REFERENCE_TODAY);
  const [rescheduleTime, setRescheduleTime] = useState<string>('18:00 – 19:00');

  // Plan-generation modal state
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genExamDate, setGenExamDate] = useState('2026-11-25');
  const [genDailyHours, setGenDailyHours] = useState(String(settings.weekdayStudyHours));
  const [genDuration, setGenDuration] = useState<30 | 45 | 60 | 90>(
    settings.preferredSessionMinutes
  );
  const [topicOverrides, setTopicOverrides] = useState<Record<string, TopicStatus>>({});

  const allTopics = useMemo(
    () =>
      subjects.flatMap((s) =>
        getSubjectTopics(s).map((t) => ({
          ...t,
          subjectCode: s.code,
        }))
      ),
    [subjects]
  );

  const openGeneratorModal = () => {
    const initialMap: Record<string, TopicStatus> = {};
    allTopics.forEach((t) => {
      initialMap[t.id] = t.status;
    });
    setTopicOverrides(initialMap);
    setGenDailyHours(String(settings.weekdayStudyHours));
    setGenDuration(settings.preferredSessionMinutes);
    setGenModalOpen(true);
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Math.max(1, Math.min(12, Number(genDailyHours) || 3.5));
    regenerateStudyPlan({
      targetExamDate: genExamDate,
      dailyHours: hours,
      preferredDurationMinutes: genDuration,
      topicOverrides,
    });
    setGenModalOpen(false);
  };

  const weeklyPlannedMinutes = studyTasks
    .filter((t) => WEEK_DAYS.some((d) => d.date === t.date))
    .reduce((acc, t) => acc + t.durationMinutes, 0);
  const weeklyCompletedMinutes = studyTasks
    .filter((t) => WEEK_DAYS.some((d) => d.date === t.date) && t.completed)
    .reduce((acc, t) => acc + t.durationMinutes, 0);

  const weeklyCapacityHours = settings.weekdayStudyHours * 5 + settings.weekendStudyHours * 2;
  const tasksForSelectedDay = studyTasks.filter((t) => t.date === selectedDay);

  const openReschedule = (task: StudyTask) => {
    setRescheduleTarget(task);
    setRescheduleDate(task.date);
    setRescheduleTime(task.timeSlot);
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    rescheduleTask(rescheduleTarget.id, rescheduleDate, rescheduleTime);
    setRescheduleTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Generate Study Plan CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Weekly Study Roadmap
          </h2>
          <p className="text-sm text-slate-600 mt-1 tabular-nums">
            {(weeklyPlannedMinutes / 60).toFixed(1)} hrs scheduled across 7 days ·{' '}
            {(weeklyCompletedMinutes / 60).toFixed(1)} hrs completed · Weekly availability{' '}
            {weeklyCapacityHours.toFixed(1)} hrs
          </p>
        </div>

        <button
          type="button"
          onClick={openGeneratorModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors whitespace-nowrap self-start lg:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-300" />
          Generate study plan
        </button>
      </div>

      {/* 7-Day Weekly Calendar Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WEEK_DAYS.map((day) => {
          const dayTasks = studyTasks.filter((t) => t.date === day.date);
          const totalMins = dayTasks.reduce((a, t) => a + t.durationMinutes, 0);
          const doneCount = dayTasks.filter((t) => t.completed).length;
          const active = selectedDay === day.date;
          const isToday = day.date === REFERENCE_TODAY;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDay(day.date)}
              className={`text-left rounded-xl p-3.5 border transition-colors ${
                active
                  ? 'bg-[#0B162C] text-white border-[#0B162C]'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={active ? 'text-teal-300 font-semibold' : 'text-slate-500'}>
                  {day.label} {isToday ? '(Today)' : ''}
                </span>
                <span className={`font-mono tabular-nums ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                  {(totalMins / 60).toFixed(1)}h
                </span>
              </div>
              <p className="font-display text-sm font-semibold mt-1">
                {formatDayMonth(day.date)}
              </p>
              <p
                className={`text-[11px] mt-2 tabular-nums ${
                  active ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {dayTasks.length === 0
                  ? 'No sessions'
                  : `${doneCount}/${dayTasks.length} completed`}
              </p>
            </button>
          );
        })}
      </section>

      {/* Daily Study Task List + Weekly Overview Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Selected Day's Task List */}
        <section className="xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Sessions for {formatDayMonth(selectedDay)}
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">
              {tasksForSelectedDay.length} scheduled tasks
            </span>
          </div>

          {tasksForSelectedDay.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No study sessions on this date</p>
              <p className="text-xs text-slate-500 mt-1">
                Use &ldquo;Generate study plan&rdquo; to automatically fill your week based on topic priorities.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
              {tasksForSelectedDay.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                    task.completed ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTaskComplete(task.id)}
                      aria-label={`Mark ${task.topicName} ${task.completed ? 'incomplete' : 'complete'}`}
                      className="mt-0.5 text-slate-500 hover:text-blue-700 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          {task.subjectCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{task.taskType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.timeSlot}</span>
                      </div>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.topicName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{task.subjectName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {task.durationMinutes} min
                    </span>
                    <button
                      type="button"
                      onClick={() => openReschedule(task)}
                      className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Available Study Hours & Subject Allocation Summary */}
        <aside className="xl:col-span-4 space-y-5">
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Weekly Bandwidth Allocation
            </h3>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Planned vs Weekly Capacity</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {(weeklyPlannedMinutes / 60).toFixed(1)}h / {weeklyCapacityHours.toFixed(1)}h
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E3A8A] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((weeklyPlannedMinutes / 60 / weeklyCapacityHours) * 100)
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Weekday target: {settings.weekdayStudyHours}h/day · Weekend target:{' '}
                {settings.weekendStudyHours}h/day.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Time Allocated by Subject
            </h3>
            <div className="divide-y divide-slate-100">
              {subjects.map((sub) => {
                const subMins = studyTasks
                  .filter((t) => t.subjectId === sub.id)
                  .reduce((a, t) => a + t.durationMinutes, 0);
                return (
                  <div
                    key={sub.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-700 font-medium truncate pr-2">
                      {sub.code} · {sub.name}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 shrink-0">
                      {(subMins / 60).toFixed(1)}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          onClick={() => setRescheduleTarget(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Reschedule Study Session
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                aria-label="Close reschedule dialog"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Moving <strong className="text-slate-900">{rescheduleTarget.subjectCode} · {rescheduleTarget.topicName}</strong>
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Date
                </label>
                <select
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {WEEK_DAYS.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}, {formatDayMonth(d.date)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Time Block
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="09:00 – 10:00">09:00 – 10:00</option>
                  <option value="14:00 – 15:00">14:00 – 15:00</option>
                  <option value="18:00 – 19:00">18:00 – 19:00</option>
                  <option value="19:15 – 20:15">19:15 – 20:15</option>
                  <option value="20:30 – 21:30">20:30 – 21:30</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747]"
                >
                  Move Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan-Generation Modal */}
      {genModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          onClick={() => setGenModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-blue-700" />
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Generate Personalized Study Plan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGenModalOpen(false)}
                aria-label="Close plan generator"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGeneratePlan} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    First Examination Date
                  </label>
                  <input
                    type="date"
                    value={genExamDate}
                    onChange={(e) => setGenExamDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Available Daily Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="12"
                    value={genDailyHours}
                    onChange={(e) => setGenDailyHours(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred Session Length
                  </label>
                  <select
                    value={genDuration}
                    onChange={(e) =>
                      setGenDuration(Number(e.target.value) as 30 | 45 | 60 | 90)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700">
                    Confirm Topic Preparation Levels
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Topics marked Not Started or In Progress with higher weightage are scheduled first
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {allTopics.slice(0, 12).map((t) => (
                    <div
                      key={t.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-slate-500 mr-2">{t.subjectCode}</span>
                        <span className="font-medium text-slate-900">{t.name}</span>
                      </div>
                      <select
                        value={topicOverrides[t.id] ?? t.status}
                        onChange={(e) =>
                          setTopicOverrides((prev) => ({
                            ...prev,
                            [t.id]: e.target.value as TopicStatus,
                          }))
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shrink-0"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Revised">Revised</option>
                        <option value="Mastered">Mastered</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGenModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747]"
                >
                  Build 7-Day Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
