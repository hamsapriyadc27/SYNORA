import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Edit3,
  FileText,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExtractedQuestion, QuestionType } from '../types/examap';
import { getSubjectTopics } from '../utils/examMetrics';

export const DocumentAnalysisScreen: React.FC = () => {
  const {
    subjects,
    documents,
    extractedQuestions,
    selectedDocumentId,
    setSelectedDocumentId,
    updateExtractedQuestion,
    approveExtractedQuestion,
    approveAllForDocument,
    navigateTo,
  } = useApp();

  const questionPaperDocs = documents.filter((d) => d.type === 'Question Paper');
  const activeDoc =
    questionPaperDocs.find((d) => d.id === selectedDocumentId) ?? questionPaperDocs[0];

  const docQuestions = activeDoc
    ? extractedQuestions.filter((q) => q.documentId === activeDoc.id)
    : [];

  const activeSubject = subjects.find((s) => s.id === activeDoc?.subjectId) ?? subjects[0];
  const topicChoices = activeSubject ? getSubjectTopics(activeSubject).map((t) => t.name) : [];

  const [editingQuestion, setEditingQuestion] = useState<ExtractedQuestion | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Review' | 'Approved'>('All');

  const filteredQuestions = docQuestions.filter((q) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending Review') return q.verificationStatus === 'Pending Review';
    return q.verificationStatus === 'Approved' || q.verificationStatus === 'Edited';
  });

  const pendingCount = docQuestions.filter(
    (q) => q.verificationStatus === 'Pending Review'
  ).length;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    updateExtractedQuestion(editingQuestion);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Verification Disclaimer */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => navigateTo('subjects', { subjectId: activeSubject?.id })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {activeSubject?.code} workspace
          </button>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Document Extraction & Verification
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Inspect parsed question numbers, mark weights, and topic mappings before syncing to Exam Analytics.
          </p>
        </div>

        {activeDoc && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => approveAllForDocument(activeDoc.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747] transition-colors whitespace-nowrap self-start lg:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
            Approve all ({pendingCount} pending)
          </button>
        )}
      </div>

      {/* Explicit Verification Banner */}
      <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Human verification required:</strong> Automated OCR and topic classification may misread multi-part sub-questions or syllabus mappings. Review items below—especially entries under 85% confidence—and click Edit or Approve before relying on them in Exam Analytics.
        </p>
      </div>

      {/* Two-Column Document Queue + Extracted Questions Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Uploaded Question Papers List */}
        <aside className="xl:col-span-4 rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Uploaded Question Papers ({questionPaperDocs.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {questionPaperDocs.map((doc) => {
              const selected = doc.id === activeDoc?.id;
              const sub = subjects.find((s) => s.id === doc.subjectId);
              const pendingInDoc = extractedQuestions.filter(
                (q) => q.documentId === doc.id && q.verificationStatus === 'Pending Review'
              ).length;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 ${
                    selected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      selected ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{doc.fileName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {sub?.code} · Year {doc.examYear || '2025'} · {doc.pageCount} pages
                    </p>
                    <p
                      className={`text-[11px] font-medium mt-1 ${
                        pendingInDoc > 0 ? 'text-amber-700' : 'text-teal-700'
                      }`}
                    >
                      {pendingInDoc > 0
                        ? `${pendingInDoc} items pending review`
                        : 'All extracted items verified'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Extracted Question Table */}
        <section className="xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                {activeDoc ? activeDoc.fileName : 'Select a document'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Showing {filteredQuestions.length} of {docQuestions.length} extracted questions
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['All', 'Pending Review', 'Approved'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No extracted questions in this view</p>
              <p className="text-xs text-slate-500 mt-1">
                Switch filter tabs or select another uploaded question paper on the left.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-200">
              {filteredQuestions.map((q) => {
                const isLowConfidence = q.confidence < 85;
                const isVerified =
                  q.verificationStatus === 'Approved' || q.verificationStatus === 'Edited';
                return (
                  <div key={q.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-900">
                          {q.questionNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-800">
                          {q.marks} marks
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{q.questionType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Page {q.sourcePage}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`font-mono tabular-nums font-medium ${
                            isLowConfidence ? 'text-amber-700' : 'text-teal-700'
                          }`}
                        >
                          {q.confidence}% confidence ({isLowConfidence ? 'Check mapping' : 'High'})
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          |
                        </span>
                        <span
                          className={`font-medium ${
                            isVerified ? 'text-teal-700' : 'text-amber-700'
                          }`}
                        >
                          {q.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed">{q.questionText}</p>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Identified topic:{' '}
                        <strong className="font-semibold text-slate-900">
                          {q.identifiedTopic}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingQuestion({ ...q })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {q.verificationStatus === 'Pending Review' && (
                          <button
                            type="button"
                            onClick={() => approveExtractedQuestion(q.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Extracted Question Modal */}
      {editingQuestion && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          onClick={() => setEditingQuestion(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Edit Extracted Question · {editingQuestion.questionNumber}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                aria-label="Close edit dialog"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Question No.
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.questionNumber}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, questionNumber: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={editingQuestion.marks}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        marks: Number(e.target.value) || 2,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Source Page
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingQuestion.sourcePage}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        sourcePage: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mapped Syllabus Topic
                  </label>
                  <select
                    value={editingQuestion.identifiedTopic}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        identifiedTopic: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {!topicChoices.includes(editingQuestion.identifiedTopic) && (
                      <option value={editingQuestion.identifiedTopic}>
                        {editingQuestion.identifiedTopic}
                      </option>
                    )}
                    {topicChoices.map((tc) => (
                      <option key={tc} value={tc}>
                        {tc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        questionType: e.target.value as QuestionType,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Short Answer">Short Answer</option>
                    <option value="Medium Analytical">Medium Analytical</option>
                    <option value="Long Problem">Long Problem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Extracted Question Text
                </label>
                <textarea
                  rows={4}
                  value={editingQuestion.questionText}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, questionText: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0B162C] text-white hover:bg-[#172747]"
                >
                  Save & Mark Verified
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
