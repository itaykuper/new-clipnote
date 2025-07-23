import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Check your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent you an email with a link to confirm your account.
          <br />
          Please check your inbox and click the link to continue.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive the email?{' '}
              <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                Try signing up again
              </Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 