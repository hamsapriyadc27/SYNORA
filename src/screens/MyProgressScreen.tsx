import React, { useState } from 'react';
import { Info, Plus } from 'lucide-react';
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
import { REFERENCE_TODAY } from '../data/mockData';
import {
  computeReadiness,
  formatShortDate,
  getOverallProgress,
  getSubjectProgress,
  getSubjectTopics,
  getTopicStatusCounts,
} from '../utils/examMetrics';
import { TopicStatusIndicator } from '../components/TopicStatusIndicator';

export const MyProgressScreen: React.FC = () => {
  const { subjects, studyTasks, practiceScores, addPracticeAssessment, navigateTo } = useApp();

  const [showLogScore, setShowLogScore] = useState(false);
  const [scoreTitle, setScoreTitle] = useState('');
  const [scoreSubjectId, setScoreSubjectId] = useState(subjects[0]?.id ?? 'sub-cs301');
  const [scoreVal, setScoreVal] = useState('80');
  const [scoreTopic, setScoreTopic] = useState('Pointers & Memory');

  const overallCompletion = getOverallProgress(subjects);
  const statusCounts = getTopicStatusCounts(subjects);
  const readiness = computeReadiness(subjects, studyTasks, practiceScores);

  const plannedVsCompletedBySubject = subjects.map((sub) => {
    const subTasks = studyTasks.filter((t) => t.subjectId === sub.id);
    return {
      code: sub.code,
      planned: subTasks.length,
      completed: subTasks.filter((t) => t.completed).length,
    };
  });

  const handleLogAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSub = subjects.find((s) => s.id === scoreSubjectId) ?? subjects[0];
    const numericScore = Math.max(0, Math.min(100, Number(scoreVal) || 0));
    addPracticeAssessment({
      title: scoreTitle.trim() || `${targetSub.code} Timed Practice Drill`,
      subjectId: targetSub.id,
      subjectCode: targetSub.code,
      subjectName: targetSub.name,
      dateTaken: REFERENCE_TODAY,
      scoreObtained: numericScore,
      maxScore: 100,
      durationMinutes: 90,
      focusTopic: scoreTopic.trim() || 'Mixed Syllabus',
    });
    setScoreTitle('');
    setShowLogScore(false);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Preparation Progress & Readiness
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Track syllabus coverage, session completion consistency, and timed practice assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogScore((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Log practice score
        </button>
      </div>

      {showLogScore && (
        <form
          onSubmit={handleLogAssessment}
          className="rounded-xl bg-white border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={scoreSubjectId}
              onChange={(e) => setScoreSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assessment Title
            </label>
            <input
              type="text"
              value={scoreTitle}
              onChange={(e) => setScoreTitle(e.target.value)}
              placeholder="e.g. 2024 Past Paper Timed"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Focus Topic</label>
            <input
              type="text"
              value={scoreTopic}
              onChange={(e) => setScoreTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Score (out of 100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={scoreVal}
              onChange={(e) => setScoreVal(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#1E3A8A] text-white hover:bg-[#1E40AF]"
            >
              Save Score
            </button>
            <button
              type="button"
              onClick={() => setShowLogScore(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Readiness Indicator + Breakdown of Contributing Factors */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-5 rounded-xl bg-[#0B162C] text-white p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-teal-300">Preparation Readiness Indicator</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-semibold tabular-nums text-white">
                {readiness.overallIndex}
              </span>
              <span className="text-sm text-slate-300 font-mono">/ 100</span>
            </div>
            <p className="text-sm font-semibold text-teal-200 mt-1">{readiness.bandLabel}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
            <span>
              This indicator measures your syllabus coverage, revision depth, and study consistency. It does not represent a guaranteed examination outcome or probability of passing.
            </span>
          </div>
        </div>

        {/* Breakdown of Factors Contributing to Readiness */}
        <div className="xl:col-span-7 rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Factors Contributing to Readiness
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Weighted calculation derived from your live preparation records
            </p>
          </div>

          <div className="space-y-4">
            {readiness.factors.map((f) => (
              <div key={f.id}>
                <div className="flex items-baseline justify-between gap-2 text-xs mb-1.5">
                  <div>
                    <span className="font-semibold text-slate-900">{f.label}</span>
                    <span className="text-slate-400 ml-2 tabular-nums">({f.weightPct}% weight)</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {f.scorePct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E3A8A] rounded-full transition-all duration-300"
                    style={{ width: `${f.scorePct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overall Syllabus Completion + Subject-wise Progress + Planned vs Completed */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Syllabus Completion & Topic Status Summary */}
        <div className="lg:col-span-6 rounded-xl bg-white border border-slate-200 p-6 space-y-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Overall Syllabus Completion
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {statusCounts.total} total syllabus topics across {subjects.length} subjects
              </p>
            </div>
            <span className="font-mono text-2xl font-semibold text-teal-700 tabular-nums">
              {overallCompletion}%
            </span>
          </div>

          {/* Topic Status Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Mastered</p>
              <p className="font-mono text-lg font-semibold text-teal-700 tabular-nums mt-0.5">
                {statusCounts.mastered}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Revised</p>
              <p className="font-mono text-lg font-semibold text-blue-700 tabular-nums mt-0.5">
                {statusCounts.revised}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">In Progress</p>
              <p className="font-mono text-lg font-semibold text-amber-700 tabular-nums mt-0.5">
                {statusCounts.inProgress}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Not Started</p>
              <p className="font-mono text-lg font-semibold text-slate-600 tabular-nums mt-0.5">
                {statusCounts.notStarted}
              </p>
            </div>
          </div>

          {/* Subject-wise Progress Bars */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {subjects.map((sub) => {
              const pct = getSubjectProgress(sub);
              return (
                <div key={sub.id}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <button
                      type="button"
                      onClick={() => navigateTo('subjects', { subjectId: sub.id })}
                      className="font-medium text-slate-800 hover:text-blue-700 text-left truncate pr-2"
                    >
                      {sub.code} · {sub.name}
                    </button>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Planned vs Completed Study Sessions */}
        <div className="lg:col-span-6 rounded-xl bg-white border border-slate-200 p-6">
          <div className="mb-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Planned vs Completed Study Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled study blocks per subject from your weekly planner
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plannedVsCompletedBySubject} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="code"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="planned" name="Planned Sessions" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="completed"
                  name="Completed Sessions"
                  fill="#0D9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Practice Assessment Scores & Topic Completion Status Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-6 rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Practice Assessment Scores
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Timed mock drills and past-paper self-evaluations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4">Assessment</th>
                  <th className="py-2.5 px-4">Focus Area</th>
                  <th className="py-2.5 px-4 text-right">Date</th>
                  <th className="py-2.5 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {practiceScores.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <span className="font-mono text-slate-500 mr-1.5">{item.subjectCode}</span>
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.focusTopic}</td>
                    <td className="py-3 px-4 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(item.dateTaken)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {item.scoreObtained}/{item.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="xl:col-span-6 rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Topic Completion Snapshot
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recently tracked syllabus topics across all subjects
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('subjects')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              Update statuses
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {subjects.flatMap((s) =>
              getSubjectTopics(s)
                .slice(0, 3)
                .map((t) => (
                  <div
                    key={t.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{t.name}</p>
                      <p className="text-slate-500 mt-0.5">
                        {s.code} · {t.historicalWeightagePct}% weightage
                      </p>
                    </div>
                    <TopicStatusIndicator status={t.status} />
                  </div>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
