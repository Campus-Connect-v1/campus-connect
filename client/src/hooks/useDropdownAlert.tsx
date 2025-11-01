
import { useState, useCallback } from "react"
import type { AlertType } from "@/src/components/ui/DropdownAlert"

interface AlertState {
  visible: boolean
  type: AlertType
  title: string
  message: string
}

export function useDropdownAlert() {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  })

  const showAlert = useCallback((type: AlertType, title: string, message: string, duration?: number) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
    })
  }, [])

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({
      ...prev,
      visible: false,
    }))
  }, [])

  const success = useCallback(
    (title: string, message: string, duration?: number) => {
      showAlert("success", title, message, duration)
    },
    [showAlert],
  )

  const error = useCallback(
    (title: string, message: string, duration?: number) => {
      showAlert("error", title, message, duration)
    },
    [showAlert],
  )

  const warning = useCallback(
    (title: string, message: string, duration?: number) => {
      showAlert("warning", title, message, duration)
    },
    [showAlert],
  )

  const info = useCallback(
    (title: string, message: string, duration?: number) => {
      showAlert("info", title, message, duration)
    },
    [showAlert],
  )

  return {
    alert,
    showAlert,
    hideAlert,
    success,
    error,
    warning,
    info,
  }
}
