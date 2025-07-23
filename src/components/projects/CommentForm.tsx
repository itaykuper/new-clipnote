'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CommentFormProps {
  projectId: string
}

export default function CommentForm({ projectId }: CommentFormProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Convert timestamp from MM:SS format to seconds
      const [minutes, seconds] = timestamp.split(':').map(Number)
      const timestampInSeconds = minutes * 60 + seconds

      const { error: submitError } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          content,
          timestamp: timestampInSeconds,
          created_by: name,
        })

      if (submitError) throw submitError

      // Reset form
      setContent('')
      setTimestamp('')
      
      // Don't reset name - keep it for next comment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Your Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">
          Timestamp (MM:SS)
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="timestamp"
            required
            pattern="[0-9]+:[0-5][0-9]"
            placeholder="0:00"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          Comment
        </label>
        <div className="mt-1">
          <textarea
            id="comment"
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {submitting ? 'Adding Comment...' : 'Add Comment'}
      </button>
    </form>
  )
} 