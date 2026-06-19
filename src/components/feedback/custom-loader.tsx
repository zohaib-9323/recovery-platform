import './custom-loader.css'

type CustomLoaderProps = {
  isPadding?: string
}

export function CustomLoader({ isPadding }: CustomLoaderProps) {
  return (
    <div className={`flex min-h-full items-center justify-center ${isPadding ?? ''}`}>
      <div className="flex space-x-2">
        <div className="customLoader" />
      </div>
    </div>
  )
}
