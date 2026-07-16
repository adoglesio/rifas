# Dashboard Administrativo — Sistema de Rifas

Painel web (React + Supabase) para o administrador acompanhar as vendas em tempo real: painel de totais, gráficos, filtros, gestão de vendedores e consulta de compradores.

---

## 1. Instalar o Node.js (só na primeira vez, se ainda não tiver)

1. Acesse **https://nodejs.org**
2. Baixe a versão **LTS** (o botão da esquerda, recomendado)
3. Execute o instalador — pode ir em "Next" até o fim
4. Confirme que instalou corretamente: abra o **Prompt de Comando** (Windows: tecla Windows, digite `cmd`, Enter) ou **Terminal** (Mac) e digite:
   ```
   node -v
   ```
   Deve aparecer algo como `v20.x.x`. Se aparecer erro, reinicie o PC e tente de novo.

## 2. Extrair o projeto

Extraia o `.zip` que te enviei em uma pasta, por exemplo `Documentos\dashboard-rifas`.

## 3. Configurar a conexão com o Supabase

Dentro da pasta do projeto:

1. Copie o arquivo `.env.example`, cole na mesma pasta e renomeie a cópia para `.env` (sem `.example` no final)
2. Abra o `.env` com o Bloco de Notas e preencha com os dados do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
   Você encontra os dois no painel do Supabase em **Project Settings → API** (`Project URL` e `anon public key`).

## 4. Rodar duas atualizações no banco (SQL Editor do Supabase)

- Se ainda não rodou, execute o `schema_rifas.sql` que te mandei antes.
- Execute também o `atualizacao_vendedores.sql`, incluído nesta pasta — ele faz o cadastro de vendedor funcionar corretamente.
- Crie seu usuário admin seguindo a seção 8 do `schema_rifas.sql`.

## 5. Instalar as dependências e rodar o projeto

Abra o terminal **dentro da pasta do projeto**:
- Windows: entre na pasta pelo Explorador de Arquivos, clique na barra de endereço no topo, digite `cmd` e aperte Enter.
- Mac: clique com o botão direito na pasta → "Novo Terminal na Pasta" (ou abra o Terminal e digite `cd` + arraste a pasta para dentro dele).

Rode, **em ordem**:
```
npm install
```
(demora um pouco na primeira vez — está baixando as bibliotecas do projeto)

```
npm run dev
```

O terminal vai mostrar um endereço, algo como `http://localhost:5173`. Abra esse endereço no navegador — é o seu dashboard. Faça login com o e-mail/senha do admin que você criou no passo 4.

Para parar o servidor, volte ao terminal e aperte `Ctrl + C`.

## 6. Publicar de verdade na internet (quando quiser sair do seu PC)

```
npm run build
```
Isso gera uma pasta `dist/`. Suba essa pasta gratuitamente em:
- **Vercel** (vercel.com) — arraste a pasta ou conecte um repositório do GitHub
- **Netlify** (netlify.com) — mesma ideia, arraste a pasta `dist` direto no site

Em ambos, lembre de configurar as mesmas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do projeto (Environment Variables).

---

## Problemas comuns

| Erro | Causa provável |
|---|---|
| `'npm' não é reconhecido...` | Node.js não instalado ou terminal aberto antes de instalar — reinstale e reabra o terminal |
| Tela de login não avança | `.env` não configurado ou usuário não está na tabela `admins` |
| Erro de CPF/telefone inválido | Vendedor/comprador precisa de CPF com 11 dígitos e telefone com DDD |
| Vendedor cadastrado mas não loga no app | Falta rodar `atualizacao_vendedores.sql`, ou ele ainda não criou a própria conta no app com o e-mail cadastrado |

---

**Próximo passo do projeto:** o App Mobile (Expo), de onde os vendedores vão registrar as vendas.
