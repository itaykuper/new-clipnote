'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { TrashIcon, PencilIcon, PlayIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import ShareButton from './ShareButton'
import RefreshButton from '../ui/RefreshButton'

interface Project {
  id: string
  title: string
  video_url: string
  thumbnail_url: string | null
  status: string
  created_at: string
  user_id: string
}

interface ProjectListProps {
  initialProjects: Project[];
}

const ProjectList = forwardRef(function ProjectList({ initialProjects }: ProjectListProps, ref) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Real-time subscription for project status updates
  React.useEffect(() => {
    if (!initialProjects.length) return

    // Set up real-time subscription
    const subscription = supabase
      .channel('project_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project updated:', payload)
          // Update the specific project in the list
          setProjects(prevProjects => 
            prevProjects.map(project => 
              project.id === payload.new.id 
                ? { ...project, status: payload.new.status }
                : project
            )
          )
        }
      )
      .subscribe()

    // Fallback: Poll for status changes every 5 seconds
    const pollInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data: updatedProjects } = await supabase
          .from('projects')
          .select('id, status')
          .eq('user_id', session.user.id)
        
        if (updatedProjects) {
          setProjects(prevProjects => 
            prevProjects.map(project => {
              const updated = updatedProjects.find(p => p.id === project.id)
              return updated ? { ...project, status: updated.status } : project
            })
          )
        }
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [supabase, initialProjects])

  React.useEffect(() => {
    // Set a fixed frame for video thumbnails (3 seconds into the video)
    projects.forEach(project => {
      if (videoRefs.current[project.id]) {
        const video = videoRefs.current[project.id]
        if (!video) return
        
        const setFixedThumbnail = () => {
          if (video.readyState >= 1 && video.duration > 0) {
            // Set to 3 seconds or 10% of video duration, whichever is smaller
            const thumbnailTime = Math.min(3, video.duration * 0.1)
            video.currentTime = thumbnailTime
            console.log(`Set fixed thumbnail for project ${project.id} at ${thumbnailTime}s`)
          }
        }

        if (video.readyState >= 1) {
          setFixedThumbnail()
        } else {
          video.addEventListener('loadedmetadata', setFixedThumbnail, { once: true })
        }
      }
    })
  }, [projects])

  const setVideoRef = (id: string, el: HTMLVideoElement | null) => {
    videoRefs.current[id] = el
  }

  const handleEdit = (project: Project) => {
    setEditing(project.id)
    setEditTitle(project.title)
    setEditStatus(project.status || 'pending')
  }

  const handleSaveEdit = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editTitle,
          status: editStatus,
        })
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, title: editTitle, status: editStatus }
          : p
      ))
      setEditing(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    }
  }

  const handleCancelEdit = () => {
    setEditing(null)
    setEditTitle('')
    setEditStatus('')
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setDeleting(projectId)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        throw error
      }

      setProjects(projects.filter(p => p.id !== projectId))
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'comment_notification':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'comment_notification':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'in_review':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  // Filter projects by search and status
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === '' ||
      (statusFilter === 'in_progress'
        ? (project.status === 'pending' || project.status === 'in_review')
        : project.status === statusFilter))
  )

  // Calculate counts for each status
  const totalCount = projects.length
  const completedCount = projects.filter(p => p.status === 'completed').length
  const inProgressCount = projects.filter(p => p.status === 'pending' || p.status === 'in_review').length
  const newCommentsCount = projects.filter(p => p.status === 'comment_notification').length

  if (!projects?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-6">Create your first project to get started with video collaboration</p>
        <Link
          href="/projects/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-rose-300 to-pink-400 text-white font-semibold rounded-xl shadow-lg hover:from-rose-400 hover:to-pink-500 transition-all duration-200 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Your First Project
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Top stats filter buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      {/* Search bar and status filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div className="flex items-center space-x-2 bg-white/80 rounded-xl px-4 py-2 border border-gray-200">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <video
                ref={(el) => setVideoRef(project.id, el)}
                src={project.video_url}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                playsInline
              />
              
              {/* Play Button Overlay */}
              <Link href={`/projects/${project.id}`}>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <PlayIcon className="w-6 h-6 text-gray-800 ml-1" />
                  </div>
                </div>
              </Link>

              {/* Status Badge */}
              <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(project.status || 'pending')} backdrop-blur-sm flex items-center space-x-1`}>
                {getStatusIcon(project.status || 'pending')}
                <span className="capitalize">
                  {project.status === 'comment_notification' ? 'New Comments' : (project.status || 'pending').replace('_', ' ')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg transition-all"
                  title="Edit project"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deleting === project.id}
                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg transition-all disabled:opacity-50"
                  title="Delete project"
                >
                  <TrashIcon className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-6">
              {editing === project.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none"
                    placeholder="Project title"
                  />
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="comment_notification">Comment Notification</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveEdit(project.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-green-600 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href={`/projects/${project.id}`} className="block group">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600 transition-colors mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-rose-300 to-pink-400 text-white text-sm font-medium rounded-lg hover:from-rose-400 hover:to-pink-500 transition-all"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    
                    <ShareButton projectId={project.id} projectTitle={project.title} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
})

export default ProjectList 