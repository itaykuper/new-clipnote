'use client'

import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-xl text-sm text-gray-700 transition-all duration-200 hover:shadow-md"
      title="Refresh projects"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  )
} 