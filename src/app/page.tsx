'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        router.push('/signup/check-email')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-cyan-100 via-blue-50 to-teal-100 overflow-hidden">
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
      {/* Left Side - Auth Form */}
      <div className="relative z-10 w-full md:flex-1 flex items-center justify-center p-4 md:p-8 flex-col">
        {/* Clipnote headline and slogan above the login card */}
        <div className="mb-3 w-full flex flex-col items-center">
          <h1 className="text-5xl font-bold mb-1 tracking-tight animated-gradient-text" style={{ letterSpacing: '.04em' }}>Clipnote</h1>
          <p className="text-xl text-center max-w-xs animated-gradient-text">Turn feedback into flow.</p>
        </div>
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-rose-300 to-pink-400 rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isSignUp ? 'Hello Again!' : 'Welcome Back!'}
              </h1>
              <p className="text-white/90 text-sm">
                {isSignUp ? "Let's get started with your 30 days trial" : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-0 bg-white/90 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 focus:outline-none transition-all placeholder-gray-500"
                />
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-0 bg-white/90 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-white/50 focus:outline-none transition-all placeholder-gray-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.25 2.25a9.969 9.969 0 01-1.5 1.5M4.21 4.21a9.969 9.969 0 00-1.5 1.5M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5C7.305 4.5 3.135 7.61 1.5 12c1.635 4.39 5.805 7.5 10.5 7.5s8.865-3.11 10.5-7.5C20.865 7.61 16.695 4.5 12 4.5zM12 15a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center mt-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-white/90">
                  Remember me
                </label>
              </div>

              {!isSignUp && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-white/80 hover:text-white">
                    Recovery Password
                  </Link>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white/90 backdrop-blur-sm text-rose-500 py-3 rounded-xl font-semibold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6">
              <div className="text-center text-white/80 text-sm mb-4">
                {isSignUp ? "Don't have an account?" : "Don't have an account?"}
              </div>
              
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-white/90 hover:text-white font-medium text-sm transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Sign up'}
              </button>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleGoogleAuth}
                  className="flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.70492L1.27498 6.60992C0.46498 8.22992 0 10.0599 0 11.9999C0 13.9399 0.46498 15.7699 1.27498 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24C15.2354 24 17.9504 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87537 19.245 6.22034 17.135 5.27037 14.29L1.28037 17.385C3.25537 21.31 7.31034 24 12.0004 24Z"
                      fill="#34A853"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Artistic Illustration (hidden on mobile) */}
      <div className="hidden md:block flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-orange-200 to-pink-300 rounded-l-[3rem]">
          {/* Sky gradient with sun */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100 via-yellow-100 to-blue-200 rounded-l-[3rem]">
            {/* Sun */}
            <div className="absolute top-16 right-24 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-70"></div>
            <div className="absolute top-20 right-28 w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full opacity-90"></div>
          </div>

          {/* Mountains layers with softer colors */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Back mountains */}
            <svg className="absolute bottom-40 w-full h-64" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,200 L0,120 Q50,80 100,100 Q150,70 200,90 Q250,60 300,80 Q350,50 400,70 L400,200 Z" 
                    fill="rgba(59, 130, 246, 0.2)" />
            </svg>
            
            {/* Middle mountains */}
            <svg className="absolute bottom-24 w-full h-48" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0,150 L0,90 Q80,50 160,70 Q240,40 320,60 Q360,35 400,50 L400,150 Z" 
                    fill="rgba(59, 130, 246, 0.4)" />
            </svg>
            
            {/* Front mountains */}
            <svg className="absolute bottom-0 w-full h-40" viewBox="0 0 400 120" preserveAspectRatio="none">
              <path d="M0,120 L0,80 Q100,30 200,50 Q300,20 400,40 L400,120 Z" 
                    fill="rgba(59, 130, 246, 0.6)" />
            </svg>
          </div>

          {/* Trees with softer colors */}
          <div className="absolute bottom-8 left-1/4">
            <div className="relative">
              <div className="w-2 h-16 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-8 h-20 bg-gray-800 clip-path-tree absolute bottom-12 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-1/2">
            <div className="relative">
              <div className="w-2 h-20 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-10 h-24 bg-gray-800 clip-path-tree absolute bottom-16 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          
          <div className="absolute bottom-8 right-1/3">
            <div className="relative">
              <div className="w-2 h-12 bg-gray-700 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-6 h-16 bg-gray-800 clip-path-tree absolute bottom-8 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 