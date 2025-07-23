"use client"
import { useState } from 'react'
import ProjectList from '@/components/projects/ProjectList'
import RefreshButton from '@/components/ui/RefreshButton'

// Dashboard client component for handling project display and filtering
export default function DashboardClient({ projects }: { projects: any[] }) {
  const [statusFilter, setStatusFilter] = useState('')
  // Calculate counts for each status
  const totalCount = projects?.length || 0
  const completedCount = projects?.filter(p => p.status === 'completed').length || 0
  const inProgressCount = projects?.filter(p => p.status === 'pending' || p.status === 'in_review').length || 0
  const newCommentsCount = projects?.filter(p => p.status === 'comment_notification').length || 0

  return (
    <>
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 mt-8">
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer ${statusFilter === '' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setStatusFilter('')}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-gray-600 text-sm">Total Projects</p>
            </div>
          </div>
        </div>
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer ${statusFilter === 'completed' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setStatusFilter('completed')}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-gray-600 text-sm">Completed</p>
            </div>
          </div>
        </div>
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer ${statusFilter === 'in_progress' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setStatusFilter('in_progress')}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
              <p className="text-gray-600 text-sm">In Progress</p>
            </div>
          </div>
        </div>
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer ${statusFilter === 'comment_notification' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setStatusFilter('comment_notification')}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{newCommentsCount}</p>
              <p className="text-gray-600 text-sm">New Comments</p>
            </div>
          </div>
        </div>
      </div>
      {/* Search bar, status filter, and refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div className="flex items-center space-x-2 bg-white/80 rounded-xl px-4 py-2 border border-gray-200">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm"
            // ProjectList will handle search state
            readOnly
          />
        </div>
        <div className="flex items-center space-x-2 justify-end w-full sm:w-auto">
          <select
            className="bg-white/80 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="comment_notification">New Comments</option>
            <option value="completed">Completed</option>
          </select>
          <RefreshButton />
        </div>
      </div>
      <ProjectList initialProjects={projects} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
    </>
  )
} 