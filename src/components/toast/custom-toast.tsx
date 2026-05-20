import { FaCheck } from 'react-icons/fa'
import { MdClear, MdInfoOutline } from 'react-icons/md'

type ToastType = 'success' | 'error' | 'info'

type CustomToastProps = {
  title: string
  message: string
  type?: ToastType
}

export function CustomToast({ title, message, type = 'success' }: CustomToastProps) {
  const settings = {
    success: {
      radial: 'bg-[radial-gradient(circle_at_left,_#e0f9ea_0%,_transparent_80%)]',
      outerCircle: 'bg-[#cefbe1]',
      innerCircle: 'bg-[#00ED51]',
      Icon: FaCheck,
    },
    error: {
      radial: 'bg-[radial-gradient(circle_at_left,_#feeced_0%,_transparent_80%)]',
      outerCircle: 'bg-[#fcd8db]',
      innerCircle: 'bg-[#F04248]',
      Icon: MdClear,
    },
    info: {
      radial: 'bg-[radial-gradient(circle_at_left,_#e0f0fe_0%,_transparent_80%)]',
      outerCircle: 'bg-[#d8e7fc]',
      innerCircle: 'bg-[#4287f0]',
      Icon: MdInfoOutline,
    },
  }[type]

  const { radial, outerCircle, innerCircle, Icon } = settings

  return (
    <div className="relative flex w-full items-center gap-3 overflow-hidden rounded-md bg-white p-3 drop-shadow-lg">
      <div className={`pointer-events-none absolute left-0 top-0 z-0 h-full w-1/3 ${radial}`} />
      <div className={`z-50 flex items-center justify-center rounded-full p-1.5 ${outerCircle}`}>
        <div className={`flex items-center justify-center rounded-full p-1 ${innerCircle}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="z-50 flex flex-col">
        <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
        <p className="text-xs text-gray-500">{message}</p>
      </div>
    </div>
  )
}
