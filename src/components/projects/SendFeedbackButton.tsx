'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SendFeedbackButtonProps {
  projectId: string
  hasComments: boolean
}

export default function SendFeedbackButton({ projectId, hasComments }: SendFeedbackButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [hasSent, setHasSent] = useState(false)
  const supabase = createClientComponentClient()

  const sendFeedback = async () => {
    if (!hasComments) {
      alert('Please add at least one comment before sending feedback.')
      return
    }

    setIsSending(true)
    try {
      // Update project status to comment_notification
      const { error } = await supabase
        .from('projects')
        .update({ status: 'comment_notification' })
        .eq('id', projectId)

      if (error) throw error

      setHasSent(true)
      alert('Feedback sent successfully! The editor has been notified.')
    } catch (error) {
      console.error('Error sending feedback:', error)
      alert('Failed to send feedback. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (hasSent) {
    return (
      <div className="flex items-center justify-center p-4 bg-green-100 text-green-800 rounded-lg">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Feedback sent successfully!
      </div>
    )
  }

  return (
    <button
      onClick={sendFeedback}
      disabled={isSending || !hasComments}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
        hasComments
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isSending ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending Feedback...
        </div>
      ) : (
        'Send Feedback'
      )}
    </button>
  )
} 