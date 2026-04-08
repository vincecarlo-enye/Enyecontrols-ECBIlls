import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { UnitFilterProvider } from '@/context/UnitFilterContext'
import { ReportsProvider } from '@/context/ReportsContext'
import ToastContainer from '@/components/ui/ToastContainer'
import AppRouter from '@/app/router'
import AIAssistant from '@/components/ai/AIAssistant'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ReportsProvider>
            <UnitFilterProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppRouter />
                <ToastContainer />
                {/* Floating AI Assistant rendered outside layouts so it stays above all pages */}
                <AIAssistant />
              </BrowserRouter>
            </UnitFilterProvider>
          </ReportsProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
