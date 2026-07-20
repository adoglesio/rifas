// supabase/functions/excluir-vendedor/index.ts
//
// Apaga o vendedor da tabela public.vendedores E o login dele no
// Supabase Auth. Só quem está na tabela public.admins pode chamar isso.
// Usa a service_role key — por isso precisa rodar aqui (servidor),
// nunca no navegador.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vendedorId } = await req.json()
    if (!vendedorId) {
      return jsonResponse({ error: 'vendedorId é obrigatório' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Não autenticado' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // cliente com o token de quem chamou, só pra descobrir quem é
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Sessão inválida' }, 401)
    }

    // cliente com privilégio total, pra checar admin e executar a exclusão
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: adminRow } = await adminClient
      .from('admins')
      .select('id')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (!adminRow) {
      return jsonResponse({ error: 'Apenas administradores podem excluir vendedores' }, 403)
    }

    const { data: vendedor, error: vendedorError } = await adminClient
      .from('vendedores')
      .select('auth_user_id, nome')
      .eq('id', vendedorId)
      .single()

    if (vendedorError || !vendedor) {
      return jsonResponse({ error: 'Vendedor não encontrado' }, 404)
    }

    const { error: deleteRowError } = await adminClient.from('vendedores').delete().eq('id', vendedorId)

    if (deleteRowError) {
      const mensagem = deleteRowError.message.includes('foreign key')
        ? `Não dá pra excluir "${vendedor.nome}" porque já existem vendas registradas por ele. Use "desativar" em vez disso.`
        : deleteRowError.message
      return jsonResponse({ error: mensagem }, 409)
    }

    if (vendedor.auth_user_id) {
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(vendedor.auth_user_id)
      if (deleteAuthError) {
        return jsonResponse(
          { error: `Vendedor removido da lista, mas não deu pra apagar o login: ${deleteAuthError.message}` },
          207
        )
      }
    }

    return jsonResponse({ ok: true }, 200)
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
