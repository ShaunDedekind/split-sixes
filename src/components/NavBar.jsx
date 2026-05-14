"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { subscribeToSync, triggerBackgroundSync } from '../utils/sync';
import { RefreshCw, AlertTriangle, WifiOff, Cloud, Flag, ClipboardList, BookOpen, Trophy, Users, Map } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();
  const [syncState, setSyncState] = useState('synced');

  useEffect(() => {
    const unsubscribe = subscribeToSync((status) => {
      setSyncState(status);
    });
    // Trigger an initial sync check when app mounts
    triggerBackgroundSync();
    return unsubscribe;
  }, []);

  const getSyncIcon = () => {
    switch(syncState) {
      case 'syncing': return <span title="Syncing..."><RefreshCw size={14} className="spin" /></span>;
      case 'error': return <span title="Sync Failed"><AlertTriangle size={14} /></span>;
      case 'offline': return <span title="Offline Mode"><WifiOff size={14} /></span>;
      default: return <span title="Synced to Cloud"><Cloud size={14} /></span>;
    }
  };

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div 
        className="sync-indicator" 
        style={{ 
          position: 'absolute', top: '-25px', right: '10px', 
          fontSize: '0.8rem', opacity: 0.7 
        }}
      >
        {getSyncIcon()}
      </div>
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="nav-icon"><Flag size={20} /></span>
        <span className="nav-label">Home</span>
      </Link>
      <Link href="/scorecard" className={`nav-item ${pathname === '/scorecard' ? 'active' : ''}`}>
        <span className="nav-icon"><ClipboardList size={20} /></span>
        <span className="nav-label">Scorecard</span>
      </Link>
      <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
        <span className="nav-icon"><BookOpen size={20} /></span>
        <span className="nav-label">History</span>
      </Link>
      <Link href="/leaderboard" className={`nav-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
        <span className="nav-icon"><Trophy size={20} /></span>
        <span className="nav-label">Leaders</span>
      </Link>
      <Link href="/players" className={`nav-item ${pathname === '/players' ? 'active' : ''}`}>
        <span className="nav-icon"><Users size={20} /></span>
        <span className="nav-label">Players</span>
      </Link>
      <Link href="/courses" className={`nav-item ${pathname === '/courses' ? 'active' : ''}`}>
        <span className="nav-icon"><Map size={20} /></span>
        <span className="nav-label">Courses</span>
      </Link>
    </nav>
  );
}
