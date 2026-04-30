import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { UnitFilterProvider } from '@/context/UnitFilterContext'
import ToastContainer from '@/components/ui/ToastContainer'
import AppRouter from '@/app/router'
import DeferredAIAssistant from '@/components/ai/DeferredAIAssistant'
import AppErrorBoundary from '@/components/common/AppErrorBoundary'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <UnitFilterProvider>
            <AppErrorBoundary>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppRouter />
                <ToastContainer />
                <DeferredAIAssistant />
              </BrowserRouter>
            </AppErrorBoundary>
          </UnitFilterProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
