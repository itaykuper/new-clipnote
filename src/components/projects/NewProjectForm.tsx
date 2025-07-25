'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Script from 'next/script'

interface NewProjectFormProps {
  userId: string
}

declare global {
  interface Window {
    cloudinary: any
  }
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB limit

export default function NewProjectForm({ userId }: NewProjectFormProps) {
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      setError('Please enter a project title')
      return
    }

    if (!videoFile) {
      setError('Please select a video file')
      return
    }

    if (videoFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Max size is 100MB.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Upload video to Supabase Storage
      const fileExt = videoFile.name.split('.').pop()
      const filePath = `users/${userId}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)
      const publicUrl = publicUrlData?.publicUrl
      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded video')
      }

      // Save project in DB
      const { error: dbError } = await supabase
        .from('projects')
        .insert({
          title,
          video_url: publicUrl,
          thumbnail_url: null, // You can add thumbnail logic later
          user_id: userId,
        })

      if (dbError) {
        throw new Error(`Database operation failed: ${dbError.message}`)
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during project creation')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Removed Cloudinary <Script> */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
            Project Title
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900">
            Video File (Max {MAX_FILE_SIZE / 1024 / 1024}MB)
          </label>
          <div className="mt-2">
            <input
              type="file"
              accept="video/mp4,video/mov,video/avi,video/webm,video/mkv"
              onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
              disabled={uploading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-green-600">
                Selected: {videoFile.name}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !videoFile}
          className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
        >
          {uploading ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </>
  )
} 