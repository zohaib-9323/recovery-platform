import type { FC } from 'react'

type InvalidSubdomainPageProps = {
  subdomain?: string
  redirectUrl?: string
}

export const InvalidSubdomainPage: FC<InvalidSubdomainPageProps> = ({
  subdomain,
  redirectUrl = 'https://develop.d2nchgv6eu8hvr.amplifyapp.com/',
}) => {
  const handleRedirect = () => {
    window.location.href = redirectUrl
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">This site can&apos;t be reached</h1>

          <div className="mb-8 text-lg text-gray-600">
            {subdomain ? (
              <p>
                The subdomain <span className="font-semibold text-red-600">{subdomain}</span> is not
                available.
              </p>
            ) : (
              <p>Please check the URL and try again, or visit our main site.</p>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleRedirect}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Main Site
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvalidSubdomainPage
