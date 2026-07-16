-- =====================================================================
-- ATUALIZAÇÃO NECESSÁRIA — rode uma vez no SQL Editor do Supabase
-- =====================================================================
-- Por quê: no dashboard, o admin cadastra o vendedor só com
-- nome/CPF/telefone/e-mail (sem senha, sem criar login).
-- Este trigger faz a ligação automática: quando o vendedor abre o
-- APP MOBILE pela primeira vez e cria a própria conta (e-mail + senha)
-- usando o MESMO e-mail que o admin cadastrou, o sistema conecta
-- esse login à linha dele na tabela `vendedores` automaticamente.
-- Sem isso, o vendedor fica cadastrado mas não consegue logar/vender.
-- =====================================================================

create or replace function public.handle_new_vendedor_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendedores
  set auth_user_id = new.id
  where lower(email) = lower(new.email)
    and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_vendedor on auth.users;

create trigger on_auth_user_created_link_vendedor
  after insert on auth.users
  for each row execute function public.handle_new_vendedor_auth();

-- =====================================================================
-- Fluxo completo de cadastro de um vendedor, na prática:
-- 1. Admin cadastra o vendedor no Dashboard (nome, CPF, telefone, e-mail)
-- 2. Admin avisa o vendedor: "seu e-mail de acesso é fulano@x.com"
-- 3. Vendedor abre o app mobile, vai em "Criar conta" e cria a senha
--    dele usando esse mesmo e-mail
-- 4. Este trigger conecta automaticamente a conta criada ao cadastro
--    já existente — o vendedor já pode vender.
-- =====================================================================
