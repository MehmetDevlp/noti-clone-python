import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout' // Yeni Layout bileşeni
import HomePage from './pages/HomePage'
import DatabasePage from './pages/DatabasePage'
import EditorPage from './pages/EditorPage'

function App() {
  return (
    // Layout tüm sayfaları kapsar
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/database/:id" element={<DatabasePage />} />
        <Route path="/page/:id" element={<EditorPage />} />
      </Routes>
    </Layout>
  )
}

export default App