import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DatabasePage from './pages/DatabasePage'
import EditorPage from './pages/EditorPage'
import CommandMenu from './components/CommandMenu'

function App() {
  return (
    <>
      {/* GÜNCELLENDİ: Sağ Üstte ve Her Şeyin Üstünde */}
      <Toaster 
        position="top-right" 
        containerStyle={{
          zIndex: 99999 // Bu sayı modal'dan yüksek olduğu için artık üstte çıkacak
        }}
      />

      <CommandMenu />
      
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