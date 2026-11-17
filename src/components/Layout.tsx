import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Compass,
  FileSearch,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScreenId } from '../types/examap';
import { getSubjectTopics } from '../utils/examMetrics';

const AVATAR_URL = '/src/assets/images/avatar_hamsa_student_1794909659902.jpg';

const NAV_ITEMS: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'examinations', label: 'My Examinations', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'analytics', label: 'Exam Analytics', icon: BarChart3 },
  { id: 'planner', label: 'Study Planner', icon: CalendarDays },
  { id: 'progress', label: 'My Progress', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SCREEN_TITLES: Record<ScreenId, string> = {
  overview: 'Overview',
  examinations: 'My Examinations',
  subjects: 'Subject Workspace',
  'document-analysis': 'Document Analysis',
  analytics: 'Exam Analytics',
  planner: 'Study Planner',
  progress: 'My Progress',
  settings: 'Settings',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeScreen,
    navigateTo,
    subjects,
    examinations,
    documents,
    studyTasks,
    selectedSubjectId,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    settings,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0];

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matches: {
      id: string;
      category: string;
      title: string;
      subtitle: string;
      action: () => void;
    }[] = [];

    subjects.forEach((sub) => {
      if (sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-sub-${sub.id}`,
          category: 'Subject',
          title: `${sub.code} — ${sub.name}`,
          subtitle: `Exam ${sub.examDate} · ${sub.papersAnalysed} papers analysed`,
          action: () => navigateTo('subjects', { subjectId: sub.id }),
        });
      }
      getSubjectTopics(sub).forEach((topic) => {
        if (topic.name.toLowerCase().includes(q) || topic.unitTitle.toLowerCase().includes(q)) {
          matches.push({
            id: `sr-top-${topic.id}`,
            category: 'Topic',
            title: topic.name,
            subtitle: `${sub.code} · ${topic.status} · ${topic.historicalWeightagePct}% historical weightage`,
            action: () => navigateTo('subjects', { subjectId: sub.id }),
          });
        }
      });
    });

    examinations.forEach((exam) => {
      if (exam.title.toLowerCase().includes(q) || exam.semester.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-exam-${exam.id}`,
          category: 'Examination',
          title: exam.title,
          subtitle: `${exam.semester} · ${exam.examPeriod}`,
          action: () => navigateTo('examinations'),
        });
      }
    });

    documents.forEach((doc) => {
      if (doc.fileName.toLowerCase().includes(q)) {
        matches.push({
          id: `sr-doc-${doc.id}`,
          category: 'Document',
          title: doc.fileName,
          subtitle: `${doc.type} · ${doc.status}`,
          action: () =>
            navigateTo('document-analysis', { subjectId: doc.subjectId, documentId: doc.id }),
        });
      }
    });

    studyTasks.forEach((task) => {
      if (
        task.topicName.toLowerCase().includes(q) ||
        task.subjectName.toLowerCase().includes(q)
      ) {
        matches.push({
          id: `sr-task-${task.id}`,
          category: 'Study Task',
          title: `${task.subjectCode} · ${task.topicName}`,
          subtitle: `${task.date} · ${task.timeSlot} (${task.durationMinutes} min)`,
          action: () => navigateTo('planner'),
        });
      }
    });

    return matches.slice(0, 8);
  }, [searchQuery, subjects, examinations, documents, studyTasks, navigateTo]);

  const handleNavClick = (id: ScreenId) => {
    navigateTo(id);
    setMobileMenuOpen(false);
  };

  const isSidebarItemActive = (itemId: ScreenId) => {
    if (activeScreen === 'document-analysis' && itemId === 'subjects') return true;
    return activeScreen === itemId;
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0B162C] text-slate-200 border-r border-slate-800/80 z-30">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] border border-blue-400/30 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-teal-300" />
          </div>
          <div className="min-w-0">
            <span className="font-display text-base font-bold tracking-tight text-white block leading-none">
              SYNORA
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 leading-none">
              Exam Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary Navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isSidebarItemActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Contextual Quick Link to Document Analysis */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigateTo('document-analysis')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
              activeScreen === 'document-analysis'
                ? 'bg-teal-500/15 border-teal-400/40 text-teal-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <FileSearch className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span className="truncate">Paper Extraction Queue</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          <p className="mt-3 px-1 text-[11px] text-slate-400 leading-relaxed">
            {settings.semester} · {settings.academicYear}
          </p>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-[#0B162C] text-slate-200 flex flex-col h-full shadow-xl">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-teal-300" />
                </div>
                <span className="font-display text-base font-bold text-white">SYNORA</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isSidebarItemActive(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/12 text-white'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${active ? 'text-teal-300' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  navigateTo('document-analysis');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeScreen === 'document-analysis'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                <FileSearch className="w-4 h-4 shrink-0 text-teal-300" />
                <span>Document Analysis</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Hamburger + Page Title / Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              {activeScreen === 'document-analysis' ? (
                <div className="flex items-center gap-1.5 text-sm min-w-0">
                  <button
                    type="button"
                    onClick={() => navigateTo('subjects')}
                    className="text-slate-500 hover:text-slate-900 font-medium whitespace-nowrap transition-colors"
                  >
                    Subjects
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline text-slate-500 truncate max-w-[160px]">
                    {activeSubject?.code}
                  </span>
                  <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate">
                    Document Analysis
                  </h1>
                </div>
              ) : (
                <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate">
                  {SCREEN_TITLES[activeScreen]}
                </h1>
              )}
            </div>
          </div>

          {/* Right: Search, Notifications, Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search examinations, subjects, and topics"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100/80 hover:bg-slate-100 hover:text-slate-900 rounded-lg border border-slate-200/80 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">Search topics, papers...</span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-900/8 overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          navigateTo(n.targetScreen, { subjectId: n.subjectId });
                          setNotifOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          n.read ? 'bg-white' : 'bg-blue-50/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 leading-snug">
                            {n.title}
                          </p>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0F172A] text-white flex items-center justify-center shrink-0 border border-slate-200">
                  {!avatarError ? (
                    <img
                      src={AVATAR_URL}
                      alt={settings.fullName}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold">HP</span>
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-semibold text-slate-900">{settings.fullName}</p>
                  <p className="text-[11px] text-slate-500">{settings.semester}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-900/8 overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{settings.fullName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{settings.email}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{settings.program}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('progress');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      My Progress & Readiness
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Profile & Study Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Live Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[1px] flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects, topics (e.g. Pointers, Arrays), papers, or tasks..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {!searchQuery.trim() ? (
                <div className="p-5">
                  <p className="text-xs font-medium text-slate-500 mb-3">Quick Jumps</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjects.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigateTo('subjects', { subjectId: sub.id });
                          setSearchOpen(false);
                        }}
                        className="text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                      >
                        <p className="text-xs font-semibold text-slate-900">
                          {sub.code} · {sub.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Exam {sub.examDate}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No matches found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for a topic like &ldquo;Pointers&rdquo;, &ldquo;File Handling&rdquo;, or a subject code like &ldquo;CS301&rdquo;.
                  </p>
                </div>
              ) : (
                searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      res.action();
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-blue-700">{res.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{res.subtitle}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                        {res.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
