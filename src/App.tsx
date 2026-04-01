import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewTask } from './pages/NewTask';
import { TaskWorkspace } from './pages/TaskWorkspace';
import { ResumeLibrary } from './pages/ResumeLibrary';
import { Applications } from './pages/Applications';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks/new" element={<NewTask />} />
            <Route path="/tasks/:id" element={<TaskWorkspace />} />
            <Route path="/resumes" element={<ResumeLibrary />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
