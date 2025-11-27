import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

// Exit animation length in ms — must match CSS animation duration
const EXIT_MS = 300

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, opts = {}) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,9)}`
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      duration: typeof opts.duration === 'number' ? opts.duration : 3500,
      exiting: false,
    }
    setToasts((s) => [toast, ...s])

    if (toast.duration > 0) {
      // start exit sequence after duration
      setTimeout(() => {
        // mark as exiting to play CSS exit animation
        setToasts((s) => s.map(t => t.id === id ? { ...t, exiting: true } : t))
        // remove after exit animation
        setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), EXIT_MS)
      }, toast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    // mark as exiting then remove after animation
    setToasts((s) => s.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), EXIT_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      <div className="toast-root" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} ${t.exiting ? 'exiting' : ''}`} onClick={() => removeToast(t.id)}>
            <div className="toast-message">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext
