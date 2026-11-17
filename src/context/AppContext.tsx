import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  INITIAL_DOCUMENTS,
  INITIAL_EXAMINATIONS,
  INITIAL_EXTRACTED_QUESTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRACTICE_SCORES,
  INITIAL_STUDY_TASKS,
  INITIAL_SUBJECTS,
  REFERENCE_TODAY,
} from '../data/mockData';
import {
  Examination,
  ExtractedQuestion,
  NotificationItem,
  PracticeAssessment,
  ScreenId,
  StudentSettings,
  StudyTask,
  Subject,
  SubjectDocument,
  ToastMessage,
  TopicStatus,
} from '../types/examap';
import { generateStudySchedule } from '../utils/examMetrics';

const STORAGE_KEY = 'examap_prototype_state_v1';

interface PersistedState {
  examinations: Examination[];
  subjects: Subject[];
  documents: SubjectDocument[];
  extractedQuestions: ExtractedQuestion[];
  studyTasks: StudyTask[];
  practiceScores: PracticeAssessment[];
  notifications: NotificationItem[];
  settings: StudentSettings;
}

interface AppContextValue extends PersistedState {
  activeScreen: ScreenId;
  selectedSubjectId: string;
  selectedDocumentId: string;
  toasts: ToastMessage[];
  navigateTo: (screen: ScreenId, opts?: { subjectId?: string; documentId?: string }) => void;
  setSelectedSubjectId: (id: string) => void;
  setSelectedDocumentId: (id: string) => void;
  pushToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
  // Examinations
  addExamination: (exam: Omit<Examination, 'id'>) => void;
  updateExamination: (exam: Examination) => void;
  deleteExamination: (id: string) => void;
  // Topics
  updateTopicStatus: (subjectId: string, topicId: string, status: TopicStatus) => void;
  // Documents & Extraction
  uploadDocument: (
    subjectId: string,
    file: File,
    docType: 'Syllabus' | 'Question Paper',
    examYear?: string
  ) => void;
  updateExtractedQuestion: (question: ExtractedQuestion) => void;
  approveExtractedQuestion: (questionId: string) => void;
  approveAllForDocument: (documentId: string) => void;
  // Study Planner
  toggleTaskComplete: (taskId: string) => void;
  rescheduleTask: (taskId: string, newDate: string, newTimeSlot: string) => void;
  addStudyTask: (task: Omit<StudyTask, 'id'>) => void;
  regenerateStudyPlan: (params: {
    targetExamDate: string;
    dailyHours: number;
    preferredDurationMinutes: 30 | 45 | 60 | 90;
    topicOverrides: Record<string, TopicStatus>;
  }) => void;
  // Practice Assessments
  addPracticeAssessment: (item: Omit<PracticeAssessment, 'id'>) => void;
  // Notifications & Settings
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  updateSettings: (next: StudentSettings) => void;
  resetPrototypeData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.subjects && parsed.examinations && parsed.settings) {
        return {
          examinations: parsed.examinations,
          subjects: parsed.subjects,
          documents: parsed.documents ?? INITIAL_DOCUMENTS,
          extractedQuestions: parsed.extractedQuestions ?? INITIAL_EXTRACTED_QUESTIONS,
          studyTasks: parsed.studyTasks ?? INITIAL_STUDY_TASKS,
          practiceScores: parsed.practiceScores ?? INITIAL_PRACTICE_SCORES,
          notifications: parsed.notifications ?? INITIAL_NOTIFICATIONS,
          settings: parsed.settings,
        };
      }
    }
  } catch {
    // Fallback to initial defaults if storage is unavailable
  }

  return {
    examinations: INITIAL_EXAMINATIONS,
    subjects: INITIAL_SUBJECTS,
    documents: INITIAL_DOCUMENTS,
    extractedQuestions: INITIAL_EXTRACTED_QUESTIONS,
    studyTasks: INITIAL_STUDY_TASKS,
    practiceScores: INITIAL_PRACTICE_SCORES,
    notifications: INITIAL_NOTIFICATIONS,
    settings: DEFAULT_SETTINGS,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-cs301');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('doc-cs301-2025');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const pushToast = (
    title: string,
    description?: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (
    screen: ScreenId,
    opts?: { subjectId?: string; documentId?: string }
  ) => {
    if (opts?.subjectId) setSelectedSubjectId(opts.subjectId);
    if (opts?.documentId) setSelectedDocumentId(opts.documentId);
    setActiveScreen(screen);
  };

  const addExamination = (examData: Omit<Examination, 'id'>) => {
    const newExamId = `exam-${Date.now()}`;
    const newExam: Examination = { ...examData, id: newExamId };

    // Also scaffold subject workspaces for newly added subjects if they don't exist
    const existingNames = new Set(state.subjects.map((s) => s.name.toLowerCase()));
    const createdSubjects: Subject[] = examData.subjectNames
      .filter((name) => name.trim() && !existingNames.has(name.trim().toLowerCase()))
      .map((name, idx) => {
        const subId = `sub-custom-${Date.now()}-${idx}`;
        const codePrefix = name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 3);
        const examDate = examData.subjectExamDates?.[name] || examData.startDate;
        return {
          id: subId,
          code: `${codePrefix}${401 + idx}`,
          name: name.trim(),
          examinationId: newExamId,
          examDate,
          examTime: '09:30 AM – 12:30 PM',
          credits: 3,
          papersAnalysed: 0,
          units: [
            {
              id: `${subId}-u1`,
              number: 1,
              title: 'Core Foundations & Principles',
              topics: [
                {
                  id: `${subId}-t1`,
                  name: `${name.trim()} Fundamentals`,
                  unitId: `${subId}-u1`,
                  unitTitle: 'Unit 1: Core Foundations & Principles',
                  status: 'Not Started',
                  historicalWeightagePct: 25,
                  appearancesInPapers: 0,
                  totalPapersAnalysed: 0,
                  avgMarks: 12,
                  estimatedHoursNeeded: 3,
                },
                {
                  id: `${subId}-t2`,
                  name: 'Analytical Problem Solving',
                  unitId: `${subId}-u1`,
                  unitTitle: 'Unit 1: Core Foundations & Principles',
                  status: 'Not Started',
                  historicalWeightagePct: 20,
                  appearancesInPapers: 0,
                  totalPapersAnalysed: 0,
                  avgMarks: 10,
                  estimatedHoursNeeded: 3,
                },
              ],
            },
          ],
        };
      });

    setState((prev) => ({
      ...prev,
      examinations: [newExam, ...prev.examinations],
      subjects: [...prev.subjects, ...createdSubjects],
    }));

    pushToast('Examination added', `${examData.title} saved with ${examData.subjectNames.length} subjects.`);
  };

  const updateExamination = (updated: Examination) => {
    setState((prev) => ({
      ...prev,
      examinations: prev.examinations.map((e) => (e.id === updated.id ? updated : e)),
    }));
    pushToast('Examination updated', `${updated.title} details have been saved.`);
  };

  const deleteExamination = (id: string) => {
    const target = state.examinations.find((e) => e.id === id);
    setState((prev) => ({
      ...prev,
      examinations: prev.examinations.filter((e) => e.id !== id),
    }));
    pushToast('Examination removed', target ? `${target.title} deleted.` : undefined, 'info');
  };

  const updateTopicStatus = (subjectId: string, topicId: string, status: TopicStatus) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          units: sub.units.map((unit) => ({
            ...unit,
            topics: unit.topics.map((topic) =>
              topic.id === topicId
                ? { ...topic, status, lastStudied: REFERENCE_TODAY }
                : topic
            ),
          })),
        };
      }),
    }));
    pushToast('Topic status updated', `Marked as ${status}.`);
  };

  const uploadDocument = (
    subjectId: string,
    file: File,
    docType: 'Syllabus' | 'Question Paper',
    examYear?: string
  ) => {
    const docId = `doc-${Date.now()}`;
    const sizeKb = Math.max(120, Math.round(file.size / 1024));
    const formattedSize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const targetSubject = state.subjects.find((s) => s.id === subjectId);
    const topicPool = targetSubject?.units.flatMap((u) => u.topics.map((t) => t.name)) ?? [
      'Core Concepts',
    ];

    const newDoc: SubjectDocument = {
      id: docId,
      subjectId,
      fileName: file.name,
      type: docType,
      examYear: examYear || '2025',
      uploadedAt: REFERENCE_TODAY,
      fileSize: formattedSize,
      pageCount: 4,
      status: 'Extracting',
      extractedCount: 0,
    };

    setState((prev) => ({
      ...prev,
      documents: [newDoc, ...prev.documents],
    }));

    pushToast('Document uploaded', `Processing ${file.name} for question extraction...`, 'info');

    // Simulate extraction completion cleanly after 1.1s
    setTimeout(() => {
      const sampleExtracted: ExtractedQuestion[] =
        docType === 'Question Paper'
          ? [
              {
                id: `eq-${Date.now()}-1`,
                documentId: docId,
                subjectId,
                questionNumber: 'Q1(a)',
                questionText: `Explain the core operational principles and edge cases associated with ${topicPool[0]} in practical implementations.`,
                marks: 8,
                questionType: 'Medium Analytical',
                identifiedTopic: topicPool[0],
                sourcePage: 1,
                confidence: 91,
                verificationStatus: 'Pending Review',
                examYear: examYear || '2025',
              },
              {
                id: `eq-${Date.now()}-2`,
                documentId: docId,
                subjectId,
                questionNumber: 'Q2(b)',
                questionText: `Design a structured solution applying ${topicPool[1] ?? topicPool[0]} and analyse its time and space tradeoffs.`,
                marks: 12,
                questionType: 'Long Problem',
                identifiedTopic: topicPool[1] ?? topicPool[0],
                sourcePage: 2,
                confidence: 76,
                verificationStatus: 'Pending Review',
                examYear: examYear || '2025',
              },
            ]
          : [];

      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: docType === 'Question Paper' ? 'Needs Review' : 'Verified',
                extractedCount: docType === 'Question Paper' ? sampleExtracted.length : topicPool.length,
              }
            : d
        ),
        extractedQuestions: [...sampleExtracted, ...prev.extractedQuestions],
      }));

      setSelectedDocumentId(docId);
      pushToast(
        'Extraction ready for review',
        `${file.name} processed. Review extracted items before adding to analytics.`
      );
    }, 1100);
  };

  const updateExtractedQuestion = (updated: ExtractedQuestion) => {
    setState((prev) => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.map((q) =>
        q.id === updated.id ? { ...updated, verificationStatus: 'Edited' } : q
      ),
    }));
    pushToast('Question updated', `${updated.questionNumber} mapping and marks saved.`);
  };

  const approveExtractedQuestion = (questionId: string) => {
    setState((prev) => {
      const nextQuestions = prev.extractedQuestions.map((q) =>
        q.id === questionId ? { ...q, verificationStatus: 'Approved' as const } : q
      );
      const target = prev.extractedQuestions.find((q) => q.id === questionId);
      const nextDocs = prev.documents.map((doc) => {
        if (!target || doc.id !== target.documentId) return doc;
        const remainingPending = nextQuestions.filter(
          (q) => q.documentId === doc.id && q.verificationStatus === 'Pending Review'
        ).length;
        return remainingPending === 0 ? { ...doc, status: 'Verified' as const } : doc;
      });
      return {
        ...prev,
        extractedQuestions: nextQuestions,
        documents: nextDocs,
      };
    });
    pushToast('Question verified', 'Approved for historical analytics.');
  };

  const approveAllForDocument = (documentId: string) => {
    setState((prev) => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.map((q) =>
        q.documentId === documentId ? { ...q, verificationStatus: 'Approved' } : q
      ),
      documents: prev.documents.map((d) =>
        d.id === documentId ? { ...d, status: 'Verified' } : d
      ),
    }));
    pushToast('All questions approved', 'Document verified and synced to historical analytics.');
  };

  const toggleTaskComplete = (taskId: string) => {
    let wasCompleted = false;
    setState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) => {
        if (t.id !== taskId) return t;
        wasCompleted = t.completed;
        return { ...t, completed: !t.completed };
      }),
    }));
    pushToast(
      wasCompleted ? 'Session marked incomplete' : 'Study session completed',
      wasCompleted ? 'Progress metrics updated.' : 'Great work — readiness metrics updated.'
    );
  };

  const rescheduleTask = (taskId: string, newDate: string, newTimeSlot: string) => {
    setState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, date: newDate, timeSlot: newTimeSlot } : t
      ),
    }));
    pushToast('Session rescheduled', `Moved to ${newDate} · ${newTimeSlot}.`);
  };

  const addStudyTask = (task: Omit<StudyTask, 'id'>) => {
    const newTask: StudyTask = { ...task, id: `task-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      studyTasks: [newTask, ...prev.studyTasks],
    }));
    pushToast('Study session added', `${task.subjectCode} · ${task.topicName}`);
  };

  const regenerateStudyPlan = (params: {
    targetExamDate: string;
    dailyHours: number;
    preferredDurationMinutes: 30 | 45 | 60 | 90;
    topicOverrides: Record<string, TopicStatus>;
  }) => {
    const generated = generateStudySchedule({
      subjects: state.subjects,
      ...params,
    });

    // Apply any topic status adjustments made inside the modal
    const updatedSubjects = state.subjects.map((sub) => ({
      ...sub,
      units: sub.units.map((u) => ({
        ...u,
        topics: u.topics.map((t) =>
          params.topicOverrides[t.id] ? { ...t, status: params.topicOverrides[t.id] } : t
        ),
      })),
    }));

    setState((prev) => ({
      ...prev,
      subjects: updatedSubjects,
      studyTasks: [
        ...prev.studyTasks.filter((t) => t.completed && t.date < REFERENCE_TODAY),
        ...generated,
      ],
    }));

    pushToast(
      'Study roadmap generated',
      `Created ${generated.length} prioritized sessions (${params.preferredDurationMinutes} min each).`
    );
  };

  const addPracticeAssessment = (item: Omit<PracticeAssessment, 'id'>) => {
    const newItem: PracticeAssessment = { ...item, id: `pa-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      practiceScores: [newItem, ...prev.practiceScores],
    }));
    pushToast('Practice score logged', `${item.subjectCode}: ${item.scoreObtained}/${item.maxScore}`);
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const updateSettings = (next: StudentSettings) => {
    setState((prev) => ({ ...prev, settings: next }));
    pushToast('Preferences saved', 'Your profile and study configuration are up to date.');
  };

  const resetPrototypeData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      examinations: INITIAL_EXAMINATIONS,
      subjects: INITIAL_SUBJECTS,
      documents: INITIAL_DOCUMENTS,
      extractedQuestions: INITIAL_EXTRACTED_QUESTIONS,
      studyTasks: INITIAL_STUDY_TASKS,
      practiceScores: INITIAL_PRACTICE_SCORES,
      notifications: INITIAL_NOTIFICATIONS,
      settings: DEFAULT_SETTINGS,
    });
    pushToast('Sample data restored', 'Prototype reset to default academic records.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        activeScreen,
        selectedSubjectId,
        selectedDocumentId,
        toasts,
        navigateTo,
        setSelectedSubjectId,
        setSelectedDocumentId,
        pushToast,
        dismissToast,
        addExamination,
        updateExamination,
        deleteExamination,
        updateTopicStatus,
        uploadDocument,
        updateExtractedQuestion,
        approveExtractedQuestion,
        approveAllForDocument,
        toggleTaskComplete,
        rescheduleTask,
        addStudyTask,
        regenerateStudyPlan,
        addPracticeAssessment,
        markAllNotificationsRead,
        markNotificationRead,
        updateSettings,
        resetPrototypeData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
