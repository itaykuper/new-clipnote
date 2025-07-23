'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { TrashIcon } from '@heroicons/react/24/outline'

interface Comment {
  id: string
  content: string
  timestamp: number
  project_id: string
  created_by: string
  created_at: string
  is_completed?: boolean
  deleted_at?: string
}

interface VideoPlayerProps {
  url: string
  projectId: string
  initialComments: Comment[]
}

export default function VideoPlayer({ url, projectId, initialComments }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const supabase = createClientComponentClient()

  // Refresh comments to get latest completion status
  useEffect(() => {
    const refreshComments = async () => {
      try {
        const { data: freshComments } = await supabase
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .order('timestamp', { ascending: true })

        if (freshComments) {
          setComments(freshComments)
        }
      } catch (error) {
        console.error('Error refreshing comments:', error)
      }
    }

    refreshComments()
  }, [projectId, supabase])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!videoRef.current || !timelineRef.current) return

    const actualDuration = duration || videoRef.current.duration || 0
    if (actualDuration === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percent * actualDuration

    // Immediately seek to clicked position
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    
    // Start dragging from this position
    setIsDragging(true)
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

        const actualDuration = duration || videoRef.current.duration || 0
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

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('Please log in to add comments')
      return
    }

    videoRef.current.pause()
    setIsAddingComment(true)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setDeletingCommentId(commentId)
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
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleSaveComment = async () => {
    if (!newComment.trim()) {
      setIsAddingComment(false)
      return
    }

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to add comments')
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          timestamp: currentTime,
          project_id: projectId,
          created_by: session.user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!comment) {
        throw new Error('No comment returned from insert')
      }

      setComments([...comments, comment])
      setNewComment('')
      setIsAddingComment(false)
    } catch (error) {
      console.error('Error saving comment:', error)
      alert('Failed to save comment. Please try again.')
    } finally {
      setIsSaving(false)
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

  const handleReplyToComment = (commentId: string) => {
    setReplyingToId(commentId)
    setReplyText('')
  }

  const handleSaveReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      setReplyingToId(null)
      return
    }

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to reply to comments')
      }

      const parentComment = comments.find(c => c.id === parentCommentId)
      if (!parentComment) {
        throw new Error('Parent comment not found')
      }

      const { data: reply, error } = await supabase
        .from('comments')
        .insert({
          content: `Reply: ${replyText.trim()}`,
          timestamp: parentComment.timestamp,
          project_id: projectId,
          created_by: session.user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!reply) {
        throw new Error('No reply returned from insert')
      }

      setComments([...comments, reply])
      setReplyText('')
      setReplyingToId(null)
    } catch (error) {
      console.error('Error saving reply:', error)
      alert('Failed to save reply. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleCompleted = async (commentId: string) => {
    try {
      const comment = comments.find(c => c.id === commentId)
      if (!comment) return

      const newCompletedStatus = !comment.is_completed

      const { error } = await supabase
        .from('comments')
        .update({ is_completed: newCompletedStatus })
        .eq('id', commentId)

      if (error) {
        throw error
      }

      // Update local state
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, is_completed: newCompletedStatus }
          : c
      ))
    } catch (error) {
      console.error('Error updating completion status:', error)
      alert('Failed to update completion status. Please try again.')
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

  // Utility: Format seconds as SRT timestamp (hh:mm:ss,ms)
  const formatSrtTime = (seconds: number) => {
    const date = new Date(0)
    date.setSeconds(Math.floor(seconds))
    const ms = Math.floor((seconds % 1) * 1000)
    return (
      date.toISOString().substr(11, 8) + ',' + ms.toString().padStart(3, '0')
    )
  }

  // Utility: Download file
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }

  // Download comments as SRT
  const handleDownloadSRT = () => {
    // Only top-level, non-deleted comments (not replies)
    const filtered = comments.filter(
      c => !c.content.startsWith('Reply:') && !c.deleted_at
    )
    const srt = filtered.map((c, i) => {
      const start = formatSrtTime(c.timestamp)
      const end = formatSrtTime(c.timestamp + 2) // 2 seconds duration
      return `${i + 1}\n${start} --> ${end}\n${c.content}\n`
    }).join('\n')
    downloadFile(srt, 'comments.srt', 'text/plain')
  }

  // Download comments as CSV
  const handleDownloadCSV = () => {
    // Only top-level, non-deleted comments (not replies)
    const filtered = comments.filter(
      c => !c.content.startsWith('Reply:') && !c.deleted_at
    )
    const header = 'author,timestamp,text' // CSV header
    const rows = filtered.map(c => {
      const author = c.created_by ? 'Editor' : 'Client'
      const time = formatTime(c.timestamp)
      // Escape quotes in text
      const text = '"' + c.content.replace(/"/g, '""') + '"'
      return `${author},${time},${text}`
    })
    const csv = [header, ...rows].join('\n')
    downloadFile(csv, 'comments.csv', 'text/csv')
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          src={url}
          controls={false}
          className="w-full rounded-lg cursor-pointer"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
              className="text-white hover:text-primary-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                {videoRef.current?.paused ? (
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
                className="text-white hover:text-primary-400 transition-colors"
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

            <span className="text-white text-sm">
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
            >
              {/* Timeline Background */}
              <div className="absolute inset-0 bg-gray-200 rounded-lg">
                {/* Progress Bar */}
                <div 
                  className="absolute h-full bg-primary-600 rounded-lg"
                  style={{ width: `${(() => {
                    const actualDuration = duration || (videoRef.current?.duration) || 0;
                    return actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;
                  })()}%` }}
                />
              </div>

              {/* Comment Markers */}
              {comments
                .filter(comment => !comment.content.startsWith('Reply:')) // Exclude replies from timeline
                .map((comment) => {
                const actualDuration = duration || (videoRef.current?.duration) || 0;
                const leftPercent = actualDuration > 0 
                  ? Math.min(95, Math.max(5, (comment.timestamp / actualDuration) * 100))
                  : 50; // Fallback positioning
                
                return (
                  <div
                    key={comment.id}
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left: `${leftPercent}%` }}
                  >
                  <div
                    className={`w-4 h-4 ${comment.created_by ? 'bg-orange-500 hover:bg-orange-400' : 'bg-pink-500 hover:bg-pink-400'} rounded-full transform -translate-x-1/2 cursor-pointer group transition-transform hover:scale-150`}
                    onClick={(e) => {
                      e.stopPropagation()
                      seekToComment(comment.timestamp)
                    }}
                    title={`${formatTime(comment.timestamp)} - ${comment.content}`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatTime(comment.timestamp)} - {comment.content}
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
                    className="absolute top-[-25px] transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded"
                    style={{ left: `${(hoverTime / actualDuration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                );
              })()}
            </div>
            
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-primary-600 text-white rounded-md shadow hover:bg-primary-700 transition-colors"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>

      {/* Add Comment Form */}
      {isAddingComment && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">
              Adding comment at {formatTime(currentTime)}
            </span>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter your comment..."
            rows={3}
            disabled={isSaving}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsAddingComment(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveComment}
              disabled={isSaving || !newComment.trim()}
              className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleDownloadSRT}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Download Comments (.srt)
        </button>
        <button
          onClick={handleDownloadCSV}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
        >
          Download Comments (.csv)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">Comments</h3>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet</p>
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
              .map((comment) => {
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
                    className={`flex items-start gap-2 p-3 rounded-lg shadow-sm group ${
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
                        {comment.is_completed && (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Completed</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-gray-900 ${
                        comment.content.startsWith('Reply:') ? 'text-xs' : 'text-sm'
                      }`}>
                        {comment.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Only show reply and complete buttons for non-reply comments */}
                      {!comment.content.startsWith('Reply:') && (
                        <>
                          <button
                            onClick={() => handleReplyToComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Reply to comment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleToggleCompleted(comment.id)}
                            className={`p-1 transition-colors ${
                              comment.is_completed
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title={comment.is_completed ? 'Mark as incomplete' : 'Mark as completed'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingToId === comment.id && !comment.content.startsWith('Reply:') && (
                    <div className="ml-6 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-700">
                          Replying to comment at {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none text-sm"
                        placeholder="Add your reply..."
                        rows={2}
                        disabled={isSaving}
                      />
                      
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveReply(comment.id)}
                          disabled={isSaving || !replyText.trim()}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                          {isSaving ? 'Saving...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 