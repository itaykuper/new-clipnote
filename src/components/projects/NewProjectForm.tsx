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
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!window.cloudinary) {
      console.error('Cloudinary not loaded')
      setError('Upload widget not ready. Please refresh the page.')
      return
    }

    console.log('Creating and opening upload widget...')
    console.log('Cloud name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'clipnote',
        sources: ['local'],
        multiple: false,
        maxFileSize: MAX_FILE_SIZE,
        resourceType: 'video',
        clientAllowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
        folder: `users/${userId}`,
      },
      (error: any, result: any) => {
        console.log('Widget callback:', { error, result })
        
        if (error) {
          console.error('Upload error:', error)
          setError('Upload failed: ' + (error.message || error.status || 'Unknown error'))
          setUploading(false)
          return
        }

        if (result.event === 'queues-start') {
          console.log('Upload starting...')
          setUploading(true)
          setError(null)
        }

        if (result.event === 'upload-added') {
          console.log('File added to queue:', result.info)
        }

        if (result.event === 'success') {
          console.log('Upload success:', result.info)
          setUploadedUrl(result.info.secure_url)
          
          // Generate thumbnail URL
          const thumbnailUrl = result.info.secure_url.replace('/upload/', '/upload/w_640,h_360,c_pad,so_auto/')
          setThumbnailUrl(thumbnailUrl)
          
          setUploading(false)
        }
      }
    )

    widget.open()
  }

  const handleScriptLoad = () => {
    console.log('Cloudinary script loaded')
    setScriptLoaded(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      setError('Please enter a project title')
      return
    }

    if (!uploadedUrl) {
      setError('Please upload a video')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('projects')
        .insert({
          title,
          video_url: uploadedUrl,
          thumbnail_url: thumbnailUrl,
          user_id: userId,
        })

      if (dbError) {
        throw new Error(`Database operation failed: ${dbError.message}`)
      }

      // Force a hard navigation to the dashboard
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
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        onLoad={handleScriptLoad}
      />
      
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
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="block w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Select Video'}
            </button>
            {uploadedUrl && (
              <p className="mt-2 text-sm text-green-600">
                Video uploaded successfully!
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
          disabled={uploading || !uploadedUrl}
          className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
        >
          {uploading ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </>
  )
} 