import type { ToastOptions } from 'react-toastify'
import { toast } from 'react-toastify'

import { CustomToast } from '@/components/toast/custom-toast'

export type ToastType = 'success' | 'error' | 'info'

type ShowCustomToastParams = {
  type?: ToastType
  title: string
  message: string
  options?: ToastOptions
}

export function showCustomToast({
  type = 'success',
  title,
  message,
  options = {},
}: ShowCustomToastParams) {
  toast(<CustomToast type={type} title={title} message={message} />, {
    icon: false,
    style: {
      width: '360px',
      background: 'transparent',
      boxShadow: 'none',
      padding: 0,
    },
    closeButton: false,
    autoClose: 3000,
    hideProgressBar: true,
    ...options,
  })
}
