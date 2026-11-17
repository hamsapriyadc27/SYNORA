import React from 'react';
import {
  ArrowRight,
  CalendarPlus,
  CalendarRange,
  FileUp,
  Layers,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { WEEKLY_ACTIVITY_DATA } from '../data/mockData';
import {
  formatShortDate,
  getDaysRemaining,
  getOverallProgress,
  getSubjectProgress,
  getSubjectTopics,
} from '../utils/examMetrics';
import { TopicStatusIndicator } from '../components/TopicStatusIndicator';

export const OverviewScreen: React.FC = () => {
  const { subjects, studyTasks, settings, navigateTo } = useApp();

  const sortedByExamDate = [...subjects].sort((a, b) =>
    a.examDate.localeCompare(b.examDate)
  );
  const nextExamSubject = sortedByExamDate[0];
  const daysToNextExam = nextExamSubject ? getDaysRemaining(nextExamSubject.examDate) : 0;
  const overallProgress = getOverallProgress(subjects);

  const completedStudyHours = Number(
    (
      studyTasks
        .filter((t) => t.completed)
        .reduce((acc, t) => acc + t.durationMinutes, 0) / 60
    ).toFixed(1)
  );
  const weeklyPlannedHours = WEEKLY_ACTIVITY_DATA.reduce((a, d) => a + d.planned, 0);
  const weeklyActualHours = WEEKLY_ACTIVITY_DATA.reduce((a, d) => a + d.completed, 0);

  // Priority topics: combine high historical weightage + incomplete status + nearest exam
  const priorityTopics = subjects
    .flatMap((sub) =>
      getSubjectTopics(sub)
        .filter((t) => t.status !== 'Mastered')
        .map((t) => {
          const urgency =
            t.status === 'Not Started' ? 1.8 : t.status === 'In Progress' ? 1.3 : 0.9;
          const days = Math.max(1, getDaysRemaining(sub.examDate));
          return {
            subjectId: sub.id,
            subjectCode: sub.code,
            subjectName: sub.name,
            examDate: sub.examDate,
            topic: t,
            score: (t.historicalWeightagePct * urgency) / Math.sqrt(days),
          };
        })
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const firstName = settings.fullName.split(' ')[0] || 'Hamsa';

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Good afternoon, {firstName}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Here is your examination preparation overview for {settings.semester}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigateTo('examinations')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-slate-500" />
            Add examination
          </button>
          <button
            type="button"
            onClick={() => navigateTo('subjects')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-500" />
            Upload question paper
          </button>
          <button
            type="button"
            onClick={() => navigateTo('planner')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors whitespace-nowrap"
          >
            <CalendarRange className="w-3.5 h-3.5 text-teal-300" />
            View study plan
          </button>
        </div>
      </div>

      {/* Dominant Next Upcoming Exam Focal Banner + Key Metrics Strip */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Next Upcoming Examination Highlight */}
        <div className="xl:col-span-5 rounded-xl bg-[#0B162C] text-white p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-teal-300 tracking-wide">
              Next Upcoming Examination
            </p>
            {nextExamSubject ? (
              <>
                <h3 className="font-display text-xl font-semibold text-white mt-2 leading-snug">
                  {nextExamSubject.code} · {nextExamSubject.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5">
                  {formatShortDate(nextExamSubject.examDate)} · {nextExamSubject.examTime}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-300 mt-2">No upcoming examinations scheduled.</p>
            )}
          </div>

          {nextExamSubject && (
            <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between gap-4">
              <div>
                <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums text-white">
                  {daysToNextExam}
                </span>
                <span className="text-xs text-slate-300 ml-2">days remaining</span>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('subjects', { subjectId: nextExamSubject.id })}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-300 hover:text-teal-200 transition-colors whitespace-nowrap"
              >
                Open workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 4 Key Metrics Grid */}
        <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Total Subjects</span>
            <div className="mt-4">
              <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900">
                {subjects.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Active cycle</p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Days Remaining</span>
            <div className="mt-4">
              <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900">
                {daysToNextExam}
              </p>
              <p className="text-xs text-slate-500 mt-1">To first paper</p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Overall Preparation</span>
            <div className="mt-4">
              <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-teal-700">
                {overallProgress}%
              </p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Weekly Study Hours</span>
            <div className="mt-4">
              <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900">
                {(weeklyActualHours + completedStudyHours * 0.25).toFixed(1)}h
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                of {weeklyPlannedHours.toFixed(1)}h planned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Study Activity Chart & Upcoming Examinations Table */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Study Activity Chart */}
        <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Weekly Study Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Planned vs completed study hours (Nov 11 – Nov 17)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#CBD5E1]" />
                Planned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1E3A8A]" />
                Completed
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ACTIVITY_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  unit="h"
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                  }}
                />
                <Bar dataKey="planned" name="Planned Hours" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="completed"
                  name="Completed Hours"
                  fill="#1E3A8A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Examination List */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Upcoming Examinations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological paper schedule</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('examinations')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              Manage all
            </button>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 flex-1">
            {sortedByExamDate.map((sub) => {
              const days = getDaysRemaining(sub.examDate);
              const pct = getSubjectProgress(sub);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => navigateTo('subjects', { subjectId: sub.id })}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-700">{sub.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatShortDate(sub.examDate)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                      {sub.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                      {days}d left
                    </p>
                    <p className="text-xs text-teal-700 tabular-nums mt-0.5">{pct}% ready</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subject-wise Progress Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Subject-wise Preparation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a subject to manage syllabus units, past papers, and topic status
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('subjects')}
            className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            Open workspace
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {subjects.map((sub) => {
            const pct = getSubjectProgress(sub);
            const topics = getSubjectTopics(sub);
            const doneCount = topics.filter(
              (t) => t.status === 'Mastered' || t.status === 'Revised'
            ).length;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => navigateTo('subjects', { subjectId: sub.id })}
                className="text-left rounded-xl bg-white border border-slate-200 p-5 hover:border-blue-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-700">{sub.code}</span>
                    <span className="tabular-nums">{sub.papersAnalysed} papers analysed</span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-slate-900 mt-2 line-clamp-2 min-h-[2.5rem]">
                    {sub.name}
                  </h4>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-500 tabular-nums">
                      {doneCount} of {topics.length} topics revised
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E3A8A] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Priority Topics Section (Clean Structured Table) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Priority Topics Requiring Attention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by historical paper weightage, preparation gap, and examination proximity
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('analytics')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Explore historical trends
          </button>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-right">Historical Weightage</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Exam Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {priorityTopics.map(({ subjectId, subjectCode, examDate, topic }) => (
                  <tr key={topic.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{topic.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-mono">{subjectCode}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {topic.historicalWeightagePct}%
                    </td>
                    <td className="py-3 px-4">
                      <TopicStatusIndicator status={topic.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(examDate)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigateTo('subjects', { subjectId })}
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                      >
                        Review topic
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
