import React, { useRef, useState } from 'react';
import {
  FileCheck2,
  FileSearch,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TopicStatus } from '../types/examap';
import {
  formatShortDate,
  getDaysRemaining,
  getSubjectProgress,
  getSubjectTopics,
} from '../utils/examMetrics';
import { TopicStatusIndicator } from '../components/TopicStatusIndicator';

const STATUS_OPTIONS: TopicStatus[] = [
  'Not Started',
  'In Progress',
  'Revised',
  'Mastered',
];

export const SubjectWorkspaceScreen: React.FC = () => {
  const {
    subjects,
    documents,
    selectedSubjectId,
    setSelectedSubjectId,
    updateTopicStatus,
    uploadDocument,
    navigateTo,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'Question Paper' | 'Syllabus'>('Question Paper');
  const [uploadYear, setUploadYear] = useState('2025');
  const [lastSelectedFileName, setLastSelectedFileName] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<'All' | TopicStatus>('All');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0];
  const subjectDocs = documents.filter((d) => d.subjectId === activeSubject.id);
  const syllabusDocs = subjectDocs.filter((d) => d.type === 'Syllabus');
  const questionPapers = subjectDocs.filter((d) => d.type === 'Question Paper');

  const subjectProgress = getSubjectProgress(activeSubject);
  const daysLeft = getDaysRemaining(activeSubject.examDate);
  const allTopics = getSubjectTopics(activeSubject);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLastSelectedFileName(file.name);
    uploadDocument(activeSubject.id, file, uploadType, uploadYear);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Subject Switcher Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200">
        {subjects.map((sub) => {
          const active = sub.id === activeSubject.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#0B162C] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono mr-1.5">{sub.code}</span>
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subject Workspace Summary Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-700">{activeSubject.code}</span>
            <span aria-hidden="true">·</span>
            <span>Exam {formatShortDate(activeSubject.examDate)}</span>
            <span aria-hidden="true">·</span>
            <span>{activeSubject.examTime}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{daysLeft} days remaining</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
            {activeSubject.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {allTopics.length} syllabus topics across {activeSubject.units.length} units ·{' '}
            {activeSubject.papersAnalysed} previous question papers analysed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[140px]">
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span className="text-slate-500">Subject readiness</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {subjectProgress}%
              </span>
            </div>
            <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${subjectProgress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo('document-analysis', {
                subjectId: activeSubject.id,
                documentId: questionPapers[0]?.id,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#1E3A8A] text-white hover:bg-[#1E40AF] transition-colors whitespace-nowrap"
          >
            <FileSearch className="w-4 h-4" />
            Analyse examination papers
          </button>
        </div>
      </section>

      {/* Main Two-Column Workspace: Syllabus Units + Documents & Upload */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Syllabus Units & Topics */}
        <section className="xl:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Syllabus Units & Topic Preparation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update preparation status to dynamically recalculate readiness and study plans
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['All', 'Not Started', 'In Progress', 'Revised', 'Mastered'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTopicFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                      topicFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-4">
            {activeSubject.units.map((unit) => {
              const filteredTopics = unit.topics.filter((t) =>
                topicFilter === 'All' ? true : t.status === topicFilter
              );
              if (filteredTopics.length === 0) return null;

              return (
                <div
                  key={unit.id}
                  className="rounded-xl bg-white border border-slate-200 overflow-hidden"
                >
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
                    <h4 className="font-display text-sm font-semibold text-slate-900">
                      Unit {unit.number}: {unit.title}
                    </h4>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {unit.topics.length} topics
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{topic.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums">
                            <span>{topic.historicalWeightagePct}% historical weightage</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {topic.appearancesInPapers}/{topic.totalPapersAnalysed} papers
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>~{topic.avgMarks} marks avg</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <TopicStatusIndicator status={topic.status} />
                          <select
                            aria-label={`Preparation status for ${topic.name}`}
                            value={topic.status}
                            onChange={(e) =>
                              updateTopicStatus(
                                activeSubject.id,
                                topic.id,
                                e.target.value as TopicStatus
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Upload PDF + Syllabus Documents + Question Papers */}
        <section className="xl:col-span-5 space-y-6">
          {/* Upload PDF Box */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Upload PDF Document
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add a syllabus outline or previous university question paper for extraction
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) =>
                    setUploadType(e.target.value as 'Question Paper' | 'Syllabus')
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Question Paper">Question Paper</option>
                  <option value="Syllabus">Syllabus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Exam Year
                </label>
                <select
                  value={uploadYear}
                  onChange={(e) => setUploadYear(e.target.value)}
                  disabled={uploadType === 'Syllabus'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-blue-500"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 p-5 text-center transition-colors"
            >
              <Upload className="w-5 h-5 text-blue-700 mx-auto" />
              <p className="text-xs font-semibold text-slate-900 mt-2">
                Select PDF file from device
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {lastSelectedFileName
                  ? `Last selected: ${lastSelectedFileName}`
                  : 'Supports PDF, DOC, DOCX · Processed locally for preview'}
              </p>
            </button>
          </div>

          {/* Previous Question Papers */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Previous Question Papers ({questionPapers.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  navigateTo('document-analysis', {
                    subjectId: activeSubject.id,
                    documentId: questionPapers[0]?.id,
                  })
                }
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Open review queue
              </button>
            </div>

            {questionPapers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No previous question papers uploaded for {activeSubject.code} yet. Upload a PDF above to inspect extracted questions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {questionPapers.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          {doc.fileSize} · {doc.pageCount} pages · {doc.extractedCount} questions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {doc.status === 'Extracting' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Extracting
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-medium ${
                            doc.status === 'Verified' ? 'text-teal-700' : 'text-amber-700'
                          }`}
                        >
                          {doc.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo('document-analysis', {
                            subjectId: activeSubject.id,
                            documentId: doc.id,
                          })
                        }
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Syllabus Documents */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Uploaded Syllabus Documents ({syllabusDocs.length})
              </h3>
            </div>
            {syllabusDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No syllabus document uploaded for this subject yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {syllabusDocs.map((doc) => (
                  <div key={doc.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          Uploaded {formatShortDate(doc.uploadedAt)} · {doc.fileSize} · {doc.pageCount}{' '}
                          pages
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-teal-700 shrink-0">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
