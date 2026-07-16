import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Painel from './pages/Painel'
import Graficos from './pages/Graficos'
import Vendas from './pages/Vendas'
import Vendedores from './pages/Vendedores'
import Compradores from './pages/Compradores'
import Produtos from './pages/Produtos'

function Protegida({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protegida><Painel /></Protegida>} />
        <Route path="/graficos" element={<Protegida><Graficos /></Protegida>} />
        <Route path="/vendas" element={<Protegida><Vendas /></Protegida>} />
        <Route path="/vendedores" element={<Protegida><Vendedores /></Protegida>} />
        <Route path="/compradores" element={<Protegida><Compradores /></Protegida>} />
        <Route path="/produtos" element={<Protegida><Produtos /></Protegida>} />
      </Routes>
    </AuthProvider>
  )
}
