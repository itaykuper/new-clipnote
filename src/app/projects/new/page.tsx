import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NewProjectForm from '@/components/projects/NewProjectForm'
import Link from 'next/link'

export default async function NewProjectPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 text-sm">Upload a video and share it with your client for feedback</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
          <NewProjectForm userId={session.user.id} />
        </div>
      </main>
    </div>
  )
} 