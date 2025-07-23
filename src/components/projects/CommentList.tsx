interface Comment {
  id: string
  content: string
  timestamp: number
  created_at: string
  created_by: string
}

interface CommentListProps {
  comments: Comment[]
}

export default function CommentList({ comments }: CommentListProps) {
  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {comment.created_by}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                <span className="font-medium text-primary-600">
                  {formatTimestamp(comment.timestamp)}
                </span>{' '}
                - {comment.content}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <div className="text-center text-sm text-gray-500">
          No comments yet. Be the first to leave feedback!
        </div>
      )}
    </div>
  )
} 