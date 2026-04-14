import type { FC } from 'react'

type TenantValidationLoaderProps = {
  message?: string
  className?: string
}

export const TenantValidationLoader: FC<TenantValidationLoaderProps> = ({
  message = 'Validating tenant access...',
  className = '',
}) => {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  )
}

export default TenantValidationLoader
