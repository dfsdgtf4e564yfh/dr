import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              userName="محمد طاهری" 
              userRole="doctor" 
            />
          } 
        />
        <Route 
          path="/manager" 
          element={
            <Dashboard 
              userName="علی رضائی" 
              userRole="manager" 
            />
          } 
        />
        <Route 
          path="/receptionist" 
          element={
            <Dashboard 
              userName="فاطمه احمدی" 
              userRole="receptionist" 
            />
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
