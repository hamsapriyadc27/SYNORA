import {
  PracticeAssessment,
  StudyTask,
  Subject,
  SyllabusTopic,
  TopicStatus,
} from '../types/examap';
import { REFERENCE_TODAY } from '../data/mockData';

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  const diff = to.getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysRemaining(examDate: string): number {
  return Math.max(0, daysBetween(REFERENCE_TODAY, examDate));
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDayMonth(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function statusWeight(status: TopicStatus): number {
  switch (status) {
    case 'Mastered':
      return 1;
    case 'Revised':
      return 0.78;
    case 'In Progress':
      return 0.42;
    case 'Not Started':
    default:
      return 0;
  }
}

export function getSubjectTopics(subject: Subject): SyllabusTopic[] {
  return subject.units.flatMap((u) => u.topics);
}

export function getSubjectProgress(subject: Subject): number {
  const topics = getSubjectTopics(subject);
  if (topics.length === 0) return 0;
  const sum = topics.reduce((acc, t) => acc + statusWeight(t.status), 0);
  return Math.round((sum / topics.length) * 100);
}

export function getOverallProgress(subjects: Subject[]): number {
  const allTopics = subjects.flatMap(getSubjectTopics);
  if (allTopics.length === 0) return 0;
  const sum = allTopics.reduce((acc, t) => acc + statusWeight(t.status), 0);
  return Math.round((sum / allTopics.length) * 100);
}

export function getTopicStatusCounts(subjects: Subject[]) {
  const allTopics = subjects.flatMap(getSubjectTopics);
  return {
    total: allTopics.length,
    mastered: allTopics.filter((t) => t.status === 'Mastered').length,
    revised: allTopics.filter((t) => t.status === 'Revised').length,
    inProgress: allTopics.filter((t) => t.status === 'In Progress').length,
    notStarted: allTopics.filter((t) => t.status === 'Not Started').length,
  };
}

export interface ReadinessBreakdown {
  overallIndex: number;
  bandLabel: 'Early Stage' | 'Building Momentum' | 'Moderate Readiness' | 'Well Prepared';
  factors: {
    id: string;
    label: string;
    weightPct: number;
    scorePct: number;
    detail: string;
  }[];
}

export function computeReadiness(
  subjects: Subject[],
  tasks: StudyTask[],
  assessments: PracticeAssessment[]
): ReadinessBreakdown {
  const allTopics = subjects.flatMap(getSubjectTopics);
  const totalTopics = allTopics.length || 1;
  const coveredTopics = allTopics.filter((t) => t.status !== 'Not Started').length;
  const masteredOrRevised = allTopics.filter(
    (t) => t.status === 'Mastered' || t.status === 'Revised'
  ).length;

  const syllabusCoveragePct = Math.round((coveredTopics / totalTopics) * 100);
  const masteryDepthPct = Math.round((masteredOrRevised / totalTopics) * 100);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const adherencePct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const avgAssessmentPct =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((acc, a) => acc + (a.scoreObtained / a.maxScore) * 100, 0) /
            assessments.length
        )
      : 0;

  const weighted = Math.round(
    syllabusCoveragePct * 0.35 +
      masteryDepthPct * 0.25 +
      adherencePct * 0.2 +
      avgAssessmentPct * 0.2
  );

  let bandLabel: ReadinessBreakdown['bandLabel'] = 'Building Momentum';
  if (weighted >= 80) bandLabel = 'Well Prepared';
  else if (weighted >= 60) bandLabel = 'Moderate Readiness';
  else if (weighted < 40) bandLabel = 'Early Stage';

  return {
    overallIndex: weighted,
    bandLabel,
    factors: [
      {
        id: 'coverage',
        label: 'Syllabus Coverage',
        weightPct: 35,
        scorePct: syllabusCoveragePct,
        detail: `${coveredTopics} of ${totalTopics} topics actively started or completed`,
      },
      {
        id: 'mastery',
        label: 'Revision & Mastery Depth',
        weightPct: 25,
        scorePct: masteryDepthPct,
        detail: `${masteredOrRevised} of ${totalTopics} topics marked Revised or Mastered`,
      },
      {
        id: 'adherence',
        label: 'Study Plan Adherence',
        weightPct: 20,
        scorePct: adherencePct,
        detail: `${completedTasks} of ${tasks.length} scheduled study sessions completed`,
      },
      {
        id: 'practice',
        label: 'Practice Paper Performance',
        weightPct: 20,
        scorePct: avgAssessmentPct,
        detail: `Mean score across ${assessments.length} timed past-paper drills`,
      },
    ],
  };
}

export function generateStudySchedule(params: {
  subjects: Subject[];
  targetExamDate: string;
  dailyHours: number;
  preferredDurationMinutes: 30 | 45 | 60 | 90;
  topicOverrides: Record<string, TopicStatus>;
}): StudyTask[] {
  const { subjects, dailyHours, preferredDurationMinutes, topicOverrides } = params;

  const prioritizedTopics = subjects
    .flatMap((subject) =>
      getSubjectTopics(subject).map((topic) => {
        const effectiveStatus = topicOverrides[topic.id] ?? topic.status;
        const urgencyMultiplier =
          effectiveStatus === 'Not Started'
            ? 3.0
            : effectiveStatus === 'In Progress'
              ? 2.1
              : effectiveStatus === 'Revised'
                ? 1.1
                : 0.4;
        const daysLeft = Math.max(1, getDaysRemaining(subject.examDate));
        const priorityScore =
          (topic.historicalWeightagePct * urgencyMultiplier) / Math.sqrt(daysLeft);
        return {
          subject,
          topic,
          effectiveStatus,
          priorityScore,
        };
      })
    )
    .filter((item) => item.effectiveStatus !== 'Mastered')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Build 7 days starting REFERENCE_TODAY (2026-11-17 to 2026-11-23)
  const baseDate = new Date(`${REFERENCE_TODAY}T00:00:00`);
  const generated: StudyTask[] = [];
  const sessionsPerDay = Math.max(
    1,
    Math.floor((dailyHours * 60) / preferredDurationMinutes)
  );

  const slotStartHours = [17, 18, 19, 20, 21, 9, 10];
  let topicCursor = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + dayOffset);
    const isoDate = d.toISOString().slice(0, 10);

    for (let s = 0; s < sessionsPerDay; s++) {
      if (prioritizedTopics.length === 0) break;
      const picked = prioritizedTopics[topicCursor % prioritizedTopics.length];
      topicCursor++;

      const startHour = slotStartHours[s % slotStartHours.length];
      const startTotalMin = startHour * 60 + (s % 2 === 1 ? 15 : 0);
      const endTotalMin = startTotalMin + preferredDurationMinutes;
      const fmt = (mins: number) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      const taskType: StudyTask['taskType'] =
        picked.effectiveStatus === 'Not Started'
          ? 'Concept Review'
          : picked.effectiveStatus === 'In Progress'
            ? 'Problem Solving'
            : 'Past Paper Practice';

      generated.push({
        id: `gen-task-${dayOffset}-${s}-${Date.now()}`,
        date: isoDate,
        timeSlot: `${fmt(startTotalMin)} – ${fmt(endTotalMin)}`,
        subjectId: picked.subject.id,
        subjectCode: picked.subject.code,
        subjectName: picked.subject.name,
        topicId: picked.topic.id,
        topicName: picked.topic.name,
        durationMinutes: preferredDurationMinutes,
        taskType,
        completed: false,
      });
    }
  }

  return generated;
}
