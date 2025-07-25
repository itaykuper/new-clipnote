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
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Cloudinary upload handler
  const handleCloudinaryUpload = () => {
    setError(null);
    setUploading(true);
    if (!window.cloudinary) {
      setError('Cloudinary widget not loaded. Please refresh the page.');
      setUploading(false);
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dtompyfxk', // your cloud name
        uploadPreset: 'clipnote', // your unsigned preset
        sources: ['local'],
        multiple: false,
        resourceType: 'video',
        clientAllowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
        maxFileSize: MAX_FILE_SIZE,
      },
      (error: any, result: any) => {
        if (error) {
          setError('Upload failed: ' + (error.message || error.status || 'Unknown error'));
          setUploading(false);
          return;
        }
        if (result.event === 'success') {
          setUploadedUrl(result.info.secure_url);
          setUploading(false);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Please enter a project title');
      return;
    }
    if (!uploadedUrl) {
      setError('Please upload a video');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Save project in DB
      const { error: dbError } = await supabase
        .from('projects')
        .insert({
          title,
          video_url: uploadedUrl,
          thumbnail_url: null,
          user_id: userId,
        });
      if (dbError) {
        throw new Error(`Database operation failed: ${dbError.message}`);
      }
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during project creation');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" />
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
              onClick={handleCloudinaryUpload}
              disabled={uploading}
              className="block w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Select & Upload Video'}
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
  );
} 