export type ScreenId =
  | 'overview'
  | 'examinations'
  | 'subjects'
  | 'document-analysis'
  | 'analytics'
  | 'planner'
  | 'progress'
  | 'settings';

export type TopicStatus = 'Not Started' | 'In Progress' | 'Revised' | 'Mastered';

export type DocumentStatus = 'Queued' | 'Extracting' | 'Needs Review' | 'Verified';

export type QuestionType = 'Short Answer' | 'Medium Analytical' | 'Long Problem';

export type QuestionVerificationStatus = 'Pending Review' | 'Approved' | 'Edited';

export interface SyllabusTopic {
  id: string;
  name: string;
  unitId: string;
  unitTitle: string;
  status: TopicStatus;
  historicalWeightagePct: number;
  appearancesInPapers: number;
  totalPapersAnalysed: number;
  avgMarks: number;
  lastStudied?: string;
  estimatedHoursNeeded: number;
}

export interface SyllabusUnit {
  id: string;
  number: number;
  title: string;
  topics: SyllabusTopic[];
}

export interface SubjectDocument {
  id: string;
  subjectId: string;
  fileName: string;
  type: 'Syllabus' | 'Question Paper';
  examYear?: string;
  uploadedAt: string;
  fileSize: string;
  pageCount: number;
  status: DocumentStatus;
  extractedCount: number;
}

export interface ExtractedQuestion {
  id: string;
  documentId: string;
  subjectId: string;
  questionNumber: string;
  questionText: string;
  marks: number;
  questionType: QuestionType;
  identifiedTopic: string;
  sourcePage: number;
  confidence: number;
  verificationStatus: QuestionVerificationStatus;
  examYear: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  examinationId: string;
  examDate: string; // YYYY-MM-DD
  examTime: string;
  credits: number;
  papersAnalysed: number;
  units: SyllabusUnit[];
}

export interface Examination {
  id: string;
  title: string;
  semester: string;
  university: string;
  examPeriod: string;
  startDate: string;
  endDate: string;
  availableDailyHours: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  subjectNames: string[];
  subjectExamDates?: Record<string, string>;
}

export interface StudyTask {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  durationMinutes: number;
  taskType: 'Concept Review' | 'Past Paper Practice' | 'Problem Solving' | 'Revision';
  completed: boolean;
}

export interface PracticeAssessment {
  id: string;
  title: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  dateTaken: string;
  scoreObtained: number;
  maxScore: number;
  durationMinutes: number;
  focusTopic: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  targetScreen: ScreenId;
  subjectId?: string;
}

export interface StudentSettings {
  fullName: string;
  email: string;
  university: string;
  program: string;
  semester: string;
  academicYear: string;
  targetGpa: string;
  weekdayStudyHours: number;
  weekendStudyHours: number;
  preferredSessionMinutes: 30 | 45 | 60 | 90;
  peakFocusWindow: 'Morning (06:00 – 11:00)' | 'Afternoon (13:00 – 17:00)' | 'Evening (18:00 – 22:30)';
  notifications: {
    examCountdowns: boolean;
    dailyStudyReminders: boolean;
    documentExtractionAlerts: boolean;
    weeklyReadinessDigest: boolean;
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning';
}

export interface YearWiseTopicTrend {
  year: string;
  Pointers: number;
  Arrays: number;
  'File Handling': number;
  Functions: number;
  Structures: number;
  [key: string]: string | number;
}
