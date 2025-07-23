import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import VideoPlayer from '@/components/projects/VideoPlayer'
import ShareButton from '@/components/projects/ShareButton'
import StatusUpdater from '@/components/projects/StatusUpdater'
import Link from 'next/link'

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) {
    notFound()
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, is_completed')
    .eq('project_id', params.id)
    .order('timestamp', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-50 to-teal-100">
      {/* Header */}
      <header className="relative backdrop-blur-sm bg-white/70 border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            {/* Go Back Button */}
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all"
              title="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600 text-sm">Project collaboration and feedback</p>
            </div>
            
            {/* Share Button */}
            <ShareButton projectId={project.id} projectTitle={project.title} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Updater Component */}
        <StatusUpdater projectId={project.id} initialStatus={project.status} />

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
          <VideoPlayer 
            url={project.video_url} 
            projectId={project.id}
            initialComments={comments || []}
          />
        </div>
      </main>
    </div>
  )
} 