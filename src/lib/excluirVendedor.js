import { supabase } from './supabaseClient'

/**
 * Exclui o vendedor E o login dele (Supabase Auth) via Edge Function.
 * Usa a sessão atual do admin — o supabase-js já manda o token
 * automaticamente, então não precisa fazer nada especial aqui.
 */
export async function excluirVendedorCompleto(vendedorId) {
  const { data, error } = await supabase.functions.invoke('excluir-vendedor', {
    body: { vendedorId },
  })

  if (error) {
    let mensagem = error.message
    try {
      const corpo = await error.context?.json?.()
      if (corpo?.error) mensagem = corpo.error
    } catch (_e) {
      // mantém a mensagem genérica se não der pra ler o corpo
    }
    return { error: new Error(mensagem) }
  }

  if (data?.error) {
    return { error: new Error(data.error) }
  }

  return { error: null }
}
