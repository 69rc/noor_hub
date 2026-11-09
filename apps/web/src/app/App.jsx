import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PreferencesProvider } from '../lib/preferences';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import { AudioProvider } from '../lib/audio-context';
import { TahajjudProvider } from '../lib/tahajjud-context';
import { AppShell } from '../components/layout/AppShell';
import { LoadingState, ErrorState } from '../components/ui';
import { Dashboard } from '../features/dashboard/Dashboard';
const Prayers = lazy(() => import('../features/prayers/Prayers'));
const Quran = lazy(() => import('../features/quran/Quran'));
const SurahReader = lazy(() => import('../features/quran/SurahReader'));
const Learn = lazy(() => import('../features/learn/Learn'));
const Lesson = lazy(() => import('../features/learn/Lesson'));
const Hadith = lazy(() => import('../features/hadith/Hadith'));
const Worship = lazy(() => import('../features/worship/Worship'));
const Journal = lazy(() => import('../features/worship/Journal'));
const Knowledge = lazy(() => import('../features/library/Knowledge'));
const Assistant = lazy(() => import('../features/assistant/Assistant'));
const Profile = lazy(() => import('../features/profile/Profile'));
const Sources = lazy(() => import('../features/profile/Sources'));
const Onboarding = lazy(() => import('../features/onboarding/Onboarding'));
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="page"><ErrorState message="This page couldn’t be displayed. Reload to return to your saved space." onRetry={() => location.reload()} /></div> : this.props.children; }
}
export default function App() {
  return <BrowserRouter><MotionConfig reducedMotion="user"><PreferencesProvider><ToastProvider><AuthProvider><AudioProvider><TahajjudProvider><ErrorBoundary><Suspense fallback={<div className="page"><LoadingState /></div>}><Routes><Route path="/welcome" element={<Onboarding />} /><Route element={<AppShell />}><Route index element={<Dashboard />} /><Route path="prayers" element={<Prayers />} /><Route path="quran" element={<Quran />} /><Route path="quran/:surah" element={<SurahReader />} /><Route path="learn" element={<Learn />} /><Route path="learn/:lesson" element={<Lesson />} /><Route path="hadith" element={<Hadith />} /><Route path="worship" element={<Worship />} /><Route path="journal" element={<Journal />} /><Route path="library" element={<Knowledge />} /><Route path="assistant" element={<Assistant />} /><Route path="profile" element={<Profile />} /><Route path="profile/sources" element={<Sources />} /><Route path="*" element={<div className="page py-24 text-center"><p className="arabic text-5xl text-emerald-700">سكينة</p><h1 className="mt-5 text-2xl font-extrabold">A quiet corner, not a wrong turn.</h1><p className="muted mt-3 text-sm">This page doesn’t exist. Let’s return to your day.</p><Link className="btn-primary mt-6" to="/">Back to Today</Link></div>} /></Route></Routes></Suspense></ErrorBoundary></TahajjudProvider></AudioProvider></AuthProvider></ToastProvider></PreferencesProvider></MotionConfig></BrowserRouter>;
}