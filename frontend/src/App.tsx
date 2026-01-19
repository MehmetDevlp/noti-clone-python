import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout' // Senin mevcut Layout bileşenin
import HomePage from './pages/HomePage'
import DatabasePage from './pages/DatabasePage'
import EditorPage from './pages/EditorPage'
// 1. CommandMenu'yu import et
import CommandMenu from './components/CommandMenu'

function App() {
  return (
    <>
      {/* 2. Global olarak buraya ekliyoruz (Layout'tan bağımsız çalışsın diye) */}
      <CommandMenu />
      
      {/* Senin mevcut düzenin aynen devam ediyor */}
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/database/:id" element={<DatabasePage />} />
          <Route path="/page/:id" element={<EditorPage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App