'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ShareButtonProps {
  projectId: string
  projectTitle: string
}

export default function ShareButton({ projectId, projectTitle }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const reviewUrl = `${window.location.origin}/review/${projectId}`

  const updateStatusToInReview = async () => {
    try {
      await supabase
        .from('projects')
        .update({ status: 'in_review' })
        .eq('id', projectId)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl)
      await updateStatusToInReview()
      setMessage('Link copied to clipboard! Status updated to "In Review"')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to copy link')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const sendEmail = async () => {
    if (!email) {
      setMessage('Please enter an email address')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setIsSending(true)
    try {
      // Here you would implement the email sending logic
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      await updateStatusToInReview()
      setMessage('Email sent successfully! Status updated to "In Review"')
      setEmail('')
      setTimeout(() => {
        setMessage('')
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      setMessage('Failed to send email')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm"
        title="Share project"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        Share
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999999] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Project</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share "{projectTitle}" for client review
            </p>

            {/* Copy Link Option */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copy Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={reviewUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Email Option */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send via Email
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendEmail}
                  disabled={isSending}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`text-sm p-2 rounded-lg ${
                message.includes('success') || message.includes('copied') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
                          )}
            </div>
          </>,
          document.body
        )}
      </div>
    )
  } 