import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { AcademicProvider } from './context/AcademicContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AcademicProvider>
          <AppRoutes />
        </AcademicProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
