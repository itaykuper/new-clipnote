'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface StatusUpdaterProps {
  projectId: string
  initialStatus: string
}

export default function StatusUpdater({ projectId, initialStatus }: StatusUpdaterProps) {
  const [showNotification, setShowNotification] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const updateStatus = async () => {
      console.log('StatusUpdater - Initial status:', initialStatus)
      
      if (initialStatus === 'comment_notification') {
        console.log('StatusUpdater - Attempting to update status from comment_notification to in_review')
        
        try {
          const { error: updateError } = await supabase
            .from('projects')
            .update({ status: 'in_review' })
            .eq('id', projectId)

          if (updateError) {
            console.error('StatusUpdater - Error updating project status:', updateError)
          } else {
            console.log('StatusUpdater - Successfully updated project status to in_review')
            setShowNotification(true)
            
            // Refresh the page to reflect the updated status
            setTimeout(() => {
              router.refresh()
              // Also refresh the dashboard when user navigates back
              if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                  // This will trigger a refresh when navigating away
                })
              }
            }, 2000) // Hide notification after 2 seconds and refresh
          }
        } catch (error) {
          console.error('StatusUpdater - Exception during status update:', error)
        }
      }
    }

    updateStatus()
  }, [projectId, initialStatus, supabase, router])

  if (!showNotification) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-xl p-4 shadow-lg">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <div>
          <h3 className="font-semibold">New Comments Received!</h3>
          <p className="text-sm opacity-90">The project status has been updated to "In Review"</p>
        </div>
      </div>
    </div>
  )
} 