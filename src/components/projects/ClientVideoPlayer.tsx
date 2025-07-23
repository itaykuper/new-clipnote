'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Comment {
  id: string
  content: string
  timestamp: number
  project_id: string
  created_by: string
  created_at: string
}

interface ClientVideoPlayerProps {
  url: string
  projectId: string
  initialComments: Comment[]
}

export default function ClientVideoPlayer({ url, projectId, initialComments }: ClientVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [clientName, setClientName] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const supabase = createClientComponentClient()

  // Debug logging
  console.log('ClientVideoPlayer render:', {
    url,
    projectId,
    commentsCount: comments.length,
    duration,
    currentTime,
    initialCommentsCount: initialComments.length
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration)
      setDuration(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    
    // Force check duration if video is already loaded
    if (video.readyState >= 1 && video.duration > 0) {
      console.log('Video already loaded, setting duration:', video.duration)
      setDuration(video.duration)
    }
    
    // Polling mechanism to ensure we get the duration
    const durationInterval = setInterval(() => {
      if (video.duration > 0 && duration === 0) {
        console.log('Duration polling found duration:', video.duration)
        setDuration(video.duration)
        clearInterval(durationInterval)
      }
    }, 100)
    
    // Clear interval after 10 seconds to avoid memory leaks
    setTimeout(() => clearInterval(durationInterval), 10000)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      clearInterval(durationInterval)
    }
  }, [])

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Timeline mouse down!')

    if (!videoRef.current || !timelineRef.current) {
      console.log('Missing video or timeline ref')
      return
    }

    // Use video.duration directly if state duration is 0
    const actualDuration = duration || videoRef.current.duration || 0
    
    if (actualDuration === 0) {
      console.log('No duration available - cannot seek')
      return
    }

    // Get the timeline element's position
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percent * actualDuration

    console.log('Timeline click calculation:', { 
      x, 
      width: rect.width, 
      percent, 
      newTime, 
      actualDuration,
      currentTime 
    })

    // Immediately seek to clicked position
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    
    // Start dragging from this position
    setIsDragging(true)
    
    console.log('Set video currentTime to:', newTime)
  }

  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    
    const actualDuration = duration || (videoRef.current?.duration) || 0
    if (actualDuration === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    setHoverTime(percent * actualDuration)
  }

  const handleIndicatorDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  // Add global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!timelineRef.current || !videoRef.current) return
        
        const actualDuration = duration || (videoRef.current?.duration) || 0
        if (actualDuration === 0) return

        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = Math.max(0, Math.min(1, x / rect.width))
        const newTime = percent * actualDuration

        videoRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, duration])

  const handleAddComment = async () => {
    if (!videoRef.current) return
    videoRef.current.pause()
    setIsAddingComment(true)
  }

  const handleSaveComment = async () => {
    if (!newComment.trim()) {
      console.log('Missing comment')
      return
    }

    console.log('Attempting to save comment:', {
      content: newComment.trim(),
      timestamp: currentTime,
      projectId
    })

    setIsSaving(true)
    try {
      // First check if we can access the comments table
      console.log('Testing table access...')
      const { data: testData, error: testError } = await supabase
        .from('comments')
        .select('*')
        .limit(1)
      
      console.log('Table access test:', { testData, testError })
      
      // For client comments, automatically set name to "client"
      const commentData = {
        content: newComment.trim(),
        timestamp: currentTime,
        project_id: projectId,
        created_by: null // Explicitly set to null for client comments
      }
      
      console.log('Inserting comment data:', commentData)
      
      const { data: comment, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single()

      console.log('Supabase insert result:', { comment, error })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!comment) {
        throw new Error('No comment returned from insert')
      }

      console.log('Comment saved successfully:', comment)
      setComments([...comments, comment])
      setNewComment('')
      setIsAddingComment(false)

    } catch (error) {
      console.error('Error saving comment:', error)
      const errorMessage = error instanceof Error ? error.message : 
                       (error && typeof error === 'object' && 'message' in error) ? error.message :
                       JSON.stringify(error);
      alert(`Failed to save comment: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendAllFeedback = async () => {
    try {
      // Update project status to comment_notification
      const { error } = await supabase
        .from('projects')
        .update({ status: 'comment_notification' })
        .eq('id', projectId)

      if (error) {
        throw error
      }

      setFeedbackSent(true)
      console.log('Project status updated to comment_notification')
      
      // Force refresh of the page/dashboard to ensure status is updated
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Try to refresh parent window if in iframe, otherwise current window
          try {
            window.parent.location.reload()
          } catch {
            window.location.reload()
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Error updating project status:', error)
      alert('Failed to send feedback. Please try again.')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const seekToComment = (timestamp: number) => {
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused
      videoRef.current.currentTime = timestamp
      
      // If video was playing, continue playing; if paused, stay paused
      if (wasPlaying) {
        videoRef.current.play()
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleToggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      if (error) {
        throw error
      }
      setComments(comments.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  if (feedbackSent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Sent!</h2>
        <p className="text-gray-600 max-w-md">
          Thank you for your feedback. The editor has been notified and will review your comments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative">
        <video
          ref={videoRef}
          src={url}
          controls={false}
          className="w-full rounded-lg shadow-lg cursor-pointer"
          onClick={() => {
            if (videoRef.current) {
              if (videoRef.current.paused) {
                videoRef.current.play()
              } else {
                videoRef.current.pause()
              }
            }
          }}
        >
          Your browser does not support the video tag.
        </video>

        {/* Custom Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
              className="text-white hover:text-rose-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                {!isPlaying ? (
                  <path d="M8 5v14l11-7z"/>
                ) : (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                )}
              </svg>
            </button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="text-white hover:text-rose-300 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : volume > 0.5 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                title="Volume"
              />
            </div>

            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration || (videoRef.current?.duration) || 0)}
            </span>
            
            {/* Timeline - Between time and button */}
            <div 
              ref={timelineRef}
              className="relative h-6 flex-1 mx-4 cursor-pointer"
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineHover}
              onMouseEnter={() => setIsHoveringTimeline(true)}
              onMouseLeave={() => setIsHoveringTimeline(false)}
              style={{ 
                touchAction: 'none',
                pointerEvents: 'auto'
              }}
            >
              {/* Timeline Background */}
              <div className="absolute inset-0 bg-gray-200 rounded-lg">
                {/* Progress Bar */}
                <div 
                  className="absolute h-full bg-primary-600 rounded-lg pointer-events-none"
                  style={{ width: `${(() => {
                    const actualDuration = duration || (videoRef.current?.duration) || 0;
                    return actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;
                  })()}%` }}
                />
              </div>

              {/* Comment Markers */}
              {comments
                .filter(comment => !comment.content.startsWith('Reply:')) // Exclude replies from timeline
                .map((comment, index) => {
                const actualDuration = duration || (videoRef.current?.duration) || 0;
                const leftPercent = actualDuration > 0 
                  ? Math.min(95, Math.max(5, (comment.timestamp / actualDuration) * 100))
                  : 20 + (index * 20);
                
                return (
                                      <div
                      key={comment.id}
                      className="absolute top-0 bottom-0 flex items-center"
                      style={{ left: `${leftPercent}%`, zIndex: 100 }}
                    >
                      <div
                        className={`w-4 h-4 ${comment.created_by ? 'bg-orange-500 hover:bg-orange-400' : 'bg-pink-500 hover:bg-pink-400'} rounded-full transform -translate-x-1/2 cursor-pointer group transition-transform hover:scale-150`}
                        onMouseDown={(e) => {
                          console.log('Comment marker clicked:', comment.timestamp)
                          e.preventDefault()
                          e.stopPropagation()
                          seekToComment(comment.timestamp)
                        }}
                        title={`${formatTime(comment.timestamp)} - ${comment.content}`}
                      >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatTime(comment.timestamp)} - {comment.content.slice(0, 30)}{comment.content.length > 30 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}

                              {/* Current Time Indicator - Draggable */}
                {(() => {
                  const actualDuration = duration || (videoRef.current?.duration) || 0;
                  return actualDuration > 0 && (
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                      style={{ left: `${(currentTime / actualDuration) * 100}%` }}
                                             onMouseDown={handleIndicatorDragStart}
                    >
                      <div className="w-4 h-4 bg-white rounded-full border-2 border-primary-600 shadow-lg hover:scale-110 transition-transform"></div>
                    </div>
                  );
                })()}

              {/* Hover Time Indicator */}
              {(() => {
                const actualDuration = duration || (videoRef.current?.duration) || 0;
                return isHoveringTimeline && actualDuration > 0 && (
                  <div 
                    className="absolute bottom-full mb-2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded pointer-events-none"
                    style={{ left: `${(hoverTime / actualDuration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                );
              })()}
            </div>
            
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-gradient-to-r from-rose-300 to-pink-400 text-white rounded-lg shadow hover:from-rose-400 hover:to-pink-500 transition-all font-medium"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>

      {/* Add Comment Form */}
      {isAddingComment && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              Adding comment at {formatTime(currentTime)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
              </label>
              <textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none"
                placeholder="Share your thoughts about this part of the video..."
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsAddingComment(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveComment}
              disabled={isSaving || !newComment.trim()}
              className="px-6 py-2 bg-gradient-to-r from-rose-300 to-pink-400 text-white rounded-lg hover:from-rose-400 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Feedback Comments</h3>
          {comments.length > 0 && (
            <button
              onClick={handleSendAllFeedback}
              className="px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all font-medium shadow-lg"
            >
              Send Back To The Editor
            </button>
          )}
        </div>
        
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Watch the video and add your feedback!
          </p>
        ) : (
          <div className="space-y-2">
            {comments
              .sort((a, b) => {
                // First sort by timestamp
                if (a.timestamp !== b.timestamp) {
                  return a.timestamp - b.timestamp
                }
                // If same timestamp, put non-replies before replies
                const aIsReply = a.content.startsWith('Reply:')
                const bIsReply = b.content.startsWith('Reply:')
                if (aIsReply && !bIsReply) return 1
                if (!aIsReply && bIsReply) return -1
                // If both are replies or both are not replies, sort by creation time
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              })
              .map((comment, index) => {
                // Calculate numbering by type
                const editorComments = comments.filter(c => c.created_by && !c.content.startsWith('Reply:')).sort((a, b) => a.timestamp - b.timestamp)
                const clientComments = comments.filter(c => !c.created_by && !c.content.startsWith('Reply:')).sort((a, b) => a.timestamp - b.timestamp)
                
                let commentNumber = 0
                if (comment.created_by && !comment.content.startsWith('Reply:')) {
                  commentNumber = editorComments.findIndex(c => c.id === comment.id) + 1
                } else if (!comment.created_by && !comment.content.startsWith('Reply:')) {
                  commentNumber = clientComments.findIndex(c => c.id === comment.id) + 1
                }

                return (
                  <div key={comment.id} className="space-y-2">
                    <div
                      className={`flex items-start gap-2 p-3 rounded-lg shadow-sm ${
                        comment.content.startsWith('Reply:') 
                          ? 'bg-blue-50 ml-6 border-l-2 border-blue-200' // Reply styling
                          : 'bg-white' // Regular comment styling
                      }`}
                    >
                      <button
                        onClick={() => seekToComment(comment.timestamp)}
                        className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          comment.created_by 
                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' // Editor comment
                            : 'text-pink-700 bg-pink-100 hover:bg-pink-200'       // Client comment
                        }`}
                      >
                        {formatTime(comment.timestamp)}
                      </button>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {comment.created_by ? 'Editor' : 'Client'}
                            {!comment.content.startsWith('Reply:') && commentNumber > 0 && ` #${commentNumber}`}
                          </span>

                        </div>
                        <p className={`text-gray-900 ${
                          comment.content.startsWith('Reply:') ? 'text-xs' : 'text-sm'
                        }`}>
                          {comment.content}
                        </p>
                        {/* Delete button for client comments */}
                        {!comment.content.startsWith('Reply:') && comment.created_by === null && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete your comment"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
} 