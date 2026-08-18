import { Routes, Route, NavLink, Outlet } from 'react-router-dom'
import DocumentsPage from './pages/DocumentsPage'
import AskPage from './pages/AskPage'

function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Personal RAG Assistant</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Preguntar
            </NavLink>
            <NavLink to="/documents" className={linkClass}>
              Documentos
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AskPage />} />
        <Route path="documents" element={<DocumentsPage />} />
      </Route>
    </Routes>
  )
}

export default App
