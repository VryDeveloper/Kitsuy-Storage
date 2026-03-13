# Kitsuy Storage

![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel)

## Sobre o Projeto

O **Kitsuy Storage** é o sistema interno de gestão da **Kitsuy Store**, desenvolvido para centralizar o controle financeiro e operacional da loja. A plataforma oferece ferramentas para registro de pedidos, acompanhamento de clientes, cálculo de preços com taxas automáticas e conversão de moeda para importações — tudo em um só lugar.

Deploy: [kitsuy-storage.vercel.app](https://kitsuy-storage.vercel.app)

---

## Tecnologias Utilizadas

- **React + TypeScript** — Interface e lógica da aplicação
- **Vite** — Bundler e ambiente de desenvolvimento
- **Supabase** — Banco de dados e autenticação
- **CSS** — Estilização da interface

---

## Funcionalidades

- **Gerenciamento de Pedidos** — Registro, acompanhamento e atualização de pedidos da loja
- **Registro de Clientes** — Cadastro e histórico de clientes
- **Calculadora de Preço** — Cálculo automático de preços com taxas de importação incluídas
- **Resumo Financeiro** — Visão geral de lucros, gastos e valores a receber
- **Conversor YEN → BRL** — Conversão de moeda com referência para importações do Japão
- **Cálculo de Taxas Automáticas** — Taxas de importação calculadas automaticamente ao precificar produtos

---

## Estrutura do Projeto

```
Kitsuy-Storage/
├── public/                  # Arquivos públicos
├── src/                     # Código-fonte da aplicação
├── supabase-rls-auth.sql    # Configuração de segurança do Supabase (RLS)
├── index.html               # Entrada da aplicação
└── vite.config.ts           # Configuração do Vite
```

---

## Como Executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/VryDeveloper/Kitsuy-Storage.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd Kitsuy-Storage
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Preencha com suas credenciais do Supabase
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## Configuração do Supabase

O projeto utiliza **Row Level Security (RLS)** do Supabase para proteger os dados. Execute o arquivo `supabase-rls-auth.sql` no painel SQL do seu projeto Supabase para configurar as políticas de acesso corretamente.

---

## Autor

Feito com 💜 por [VryDeveloper](https://github.com/VryDeveloper)
