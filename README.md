# Kitsuy Storage

![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel)

## About

**Kitsuy Storage** is the internal management system for **Kitsuy Store**, built to centralize the store's financial and operational control. The platform provides tools for order tracking, customer management, price calculation with automatic import taxes and currency conversion — all in one place.

Deploy: [kitsuy-storage.vercel.app](https://kitsuy-storage.vercel.app)

---

## Technologies

- **React + TypeScript** — UI and application logic
- **Vite** — Bundler and development environment
- **Supabase** — Database and authentication
- **CSS** — Interface styling

---

## Features

- **Order Management** — Register, track and update store orders
- **Customer Records** — Customer registration and history
- **Price Calculator** — Automatic pricing with import taxes included
- **Financial Summary** — Overview of profits, expenses and receivables
- **YEN → BRL Converter** — Currency conversion reference for Japanese imports
- **Automatic Tax Calculation** — Import taxes calculated automatically when pricing products

---

## Project Structure

```
Kitsuy-Storage/
├── public/                  # Public assets
├── src/                     # Application source code
├── supabase-rls-auth.sql    # Supabase security configuration (RLS)
├── index.html               # App entry point
└── vite.config.ts           # Vite configuration
```

---

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/VryDeveloper/Kitsuy-Storage.git
   ```
2. Navigate to the project folder:
   ```bash
   cd Kitsuy-Storage
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in with your Supabase credentials
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

---

## Supabase Configuration

This project uses Supabase **Row Level Security (RLS)** to protect data. Run the `supabase-rls-auth.sql` file in your Supabase project's SQL editor to properly configure access policies.

---

## Author

Made with 💜 by [VryDeveloper](https://github.com/VryDeveloper)

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
