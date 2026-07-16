import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cria o login (auth) de um vendedor a partir do Dashboard.
 *
 * Por que um cliente Supabase separado? `supabase.auth.signUp()` também
 * *loga* automaticamente com o usuário recém-criado. Se usássemos o mesmo
 * cliente que o admin está logado, o admin seria desconectado e o
 * navegador ficaria logado como o vendedor novo. Este cliente isolado
 * (storageKey próprio, sem persistir sessão) evita isso — ele existe só
 * durante essa chamada e é descartado em seguida.
 *
 * Isso usa só a ANON KEY (a mesma já usada no resto do dashboard).
 * NUNCA use a service_role key no navegador.
 */
export async function criarLoginVendedor(email, senha) {
  const clienteTemporario = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'temp-criar-vendedor',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { data, error } = await clienteTemporario.auth.signUp({ email, password: senha })

  // essa sessão temporária não deve persistir de jeito nenhum
  await clienteTemporario.auth.signOut().catch(() => {})

  return { data, error }
}
