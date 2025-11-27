import '../styles/globals.css';
import '../styles/auth.css';
import { ToastProvider } from '../components/ToastContext'

export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  )
}
