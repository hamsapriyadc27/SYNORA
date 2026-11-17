/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ToastStack } from './components/ToastStack';
import { OverviewScreen } from './screens/OverviewScreen';
import { ExaminationsScreen } from './screens/ExaminationsScreen';
import { SubjectWorkspaceScreen } from './screens/SubjectWorkspaceScreen';
import { DocumentAnalysisScreen } from './screens/DocumentAnalysisScreen';
import { ExamAnalyticsScreen } from './screens/ExamAnalyticsScreen';
import { StudyPlannerScreen } from './screens/StudyPlannerScreen';
import { MyProgressScreen } from './screens/MyProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const ScreenRouter: React.FC = () => {
  const { activeScreen } = useApp();

  switch (activeScreen) {
    case 'overview':
      return <OverviewScreen />;
    case 'examinations':
      return <ExaminationsScreen />;
    case 'subjects':
      return <SubjectWorkspaceScreen />;
    case 'document-analysis':
      return <DocumentAnalysisScreen />;
    case 'analytics':
      return <ExamAnalyticsScreen />;
    case 'planner':
      return <StudyPlannerScreen />;
    case 'progress':
      return <MyProgressScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <OverviewScreen />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <ScreenRouter />
      </Layout>
      <ToastStack />
    </AppProvider>
  );
}
