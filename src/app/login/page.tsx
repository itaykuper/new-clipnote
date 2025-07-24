"use client"
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center py-6 px-2 sm:px-6 lg:px-8 bg-white md:bg-gray-50 overflow-hidden">
      {/* Mobile-only full-screen illustration background */}
      <div className="absolute inset-0 z-0 md:hidden">
        <div className="w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100 via-yellow-100 to-blue-200">
            {/* Sun */}
            <div className="absolute top-10 right-10 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-70"></div>
            <div className="absolute top-16 right-16 w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full opacity-90"></div>
          </div>
          {/* Mountains layers with softer colors */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Back mountains */}
            <svg className="absolute bottom-32 w-full h-40" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,200 L0,120 Q50,80 100,100 Q150,70 200,90 Q250,60 300,80 Q350,50 400,70 L400,200 Z" fill="rgba(59, 130, 246, 0.2)" />
            </svg>
            {/* Middle mountains */}
            <svg className="absolute bottom-16 w-full h-32" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0,150 L0,90 Q80,50 160,70 Q240,40 320,60 Q360,35 400,50 L400,150 Z" fill="rgba(59, 130, 246, 0.4)" />
            </svg>
            {/* Front mountains */}
            <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 400 120" preserveAspectRatio="none">
              <path d="M0,120 L0,80 Q100,30 200,50 Q300,20 400,40 L400,120 Z" fill="rgba(59, 130, 246, 0.6)" />
            </svg>
          </div>
          {/* Trees with softer colors */}
          <div className="absolute bottom-6 left-1/4">
            <div className="relative">
              <div className="w-1 h-8 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-4 h-10 bg-gray-800 clip-path-tree absolute bottom-6 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2">
            <div className="relative">
              <div className="w-1 h-10 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-5 h-12 bg-gray-800 clip-path-tree absolute bottom-8 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          <div className="absolute bottom-6 right-1/3">
            <div className="relative">
              <div className="w-1 h-6 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-3 h-8 bg-gray-800 clip-path-tree absolute bottom-4 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Login content above background */}
      <div className="relative z-10">
        <div className="sm:mx-auto w-full sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-4xl font-extrabold text-primary-600 tracking-tight">Clipnote</h1>
          <p className="mt-2 text-center text-gray-600 text-base">Collaborate on video feedback, faster.</p>
        </div>
        <div className="mt-8 sm:mx-auto w-full sm:w-full sm:max-w-md">
          <div className="bg-white/90 md:bg-white px-2 py-6 shadow sm:rounded-lg sm:px-10 w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
} 