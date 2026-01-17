import { useState } from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // Sidebar varsayılan olarak açık olsun
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#191919] text-white flex">
      {/* SOL TARAFTA SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* SAĞ TARAFTA İÇERİK */}
      <div 
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* İçeriğin kendisi */}
        <div className="w-full min-h-screen">
            {children}
        </div>
      </div>
    </div>
  )
}