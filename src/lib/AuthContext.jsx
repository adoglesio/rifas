import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(null) // null = carregando, false = não é admin
  const [adminNome, setAdminNome] = useState('')
  const [loading, setLoading] = useState(true)

  async function checkAdmin(currentSession) {
    if (!currentSession) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('admins')
      .select('nome')
      .eq('id', currentSession.user.id)
      .maybeSingle()

    if (error || !data) {
      setIsAdmin(false)
    } else {
      setIsAdmin(true)
      setAdminNome(data.nome)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      checkAdmin(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(true)
      checkAdmin(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, adminNome, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
