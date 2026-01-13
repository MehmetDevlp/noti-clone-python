import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DatabasePage from './pages/DatabasePage'

function App() {
  return (
    <div className="min-h-screen bg-notion-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/database/:id" element={<DatabasePage />} />
      </Routes>
    </div>
  )
}

export default App