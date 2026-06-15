import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Users, Megaphone, Send } from 'lucide-react';
import { apiClient } from './api/client';

import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Customers from './pages/Customers';
import AIChat from './components/AIChat';

function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/campaigns', icon: <Megaphone size={20} />, label: 'Campaigns' },
    { path: '/customers', icon: <Users size={20} />, label: 'Customers' },
  ];

  return (
    <div className="app-container">
      {/* Left Sidebar - Navigation & AI Chat */}
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-tertiary)' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ☕ BrewCo CRM
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1rem' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--border-radius-sm)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'rgba(240, 165, 0, 0.1)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* AI Chat takes the rest of the sidebar space */}
        <div style={{ flex: 1, borderTop: '1px solid var(--bg-tertiary)', overflow: 'hidden' }}>
          <AIChat />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
