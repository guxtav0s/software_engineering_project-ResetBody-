# 🧘 ResetBody

Projeto inicial do **ResetBody**, voltado para incentivar pausas regulares e promover bem-estar físico e mental durante o uso prolongado de computadores ou celulares.

---

## 📁 Estrutura de Pastas

```
resetbody/
├── docs/             # Documentação (manual, requisitos, diagramas)
├── src/              # Código-fonte principal
│   ├── assets/       # Imagens, ícones e fontes
│   ├── css/          # Arquivos de estilo (CSS)
│   ├── js/           # Scripts JavaScript do frontend
│   ├── pages/        # Páginas HTML (index.html, about.html, etc.)
│   └── backend/      # Código backend em Node.js/Express
│       ├── routes/   # Rotas da API (login, pausas, exercícios)
│       ├── models/   # Modelos conectados ao MySQL
│       ├── controllers/ # Lógica das rotas
│       └── config/   # Configuração do banco (MySQL)
├── tests/            # Testes unitários e de integração
├── .gitignore        # Arquivos/pastas ignorados pelo Git
└── README.md         # Descrição geral do projeto
```
---

## 🎯 Objetivo
- Criar um site responsivo e minimalista.  
- Implementar lembretes de pausas e exercícios rápidos.  
- Integrar com banco de dados **MySQL** para salvar estatísticas de uso.  

---

## 🚀 Tecnologias
- **[HTML5](ca://s?q=HTML5)**, **[CSS3](ca://s?q=CSS3)** e **[JavaScript](ca://s?q=JavaScript)**  
- **[Node.js](ca://s?q=Node.js)** + **[Express](ca://s?q=Express.js)**  
- **[Sequelize](ca://s?q=Sequelize)** para integração com **[MySQL](ca://s?q=MySQL)**  
- **[GitHub](ca://s?q=GitHub)** para versionamento e colaboração  

---

## 📌 Status
Este commit inicial contém apenas a **estrutura de pastas** e o **README.md**.  
As próximas etapas incluem criação dos arquivos básicos (`index.html`, `style.css`, `script.js`, `server.js`) e configuração do banco de dados.

---

## 📜 Licença
MIT License

Copyright (c) 2026 Pedro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## 🔔 Notificações Web Push do Pomodoro

O Pomodoro pode enviar notificações mesmo quando a aba está em segundo plano ou fechada. Para isso, o projeto usa um Service Worker, a API Push do navegador e um servidor Node.js com VAPID.

### Requisitos
- Node.js 18 ou superior.
- Navegador com suporte a Service Worker e Web Push.
- HTTPS em produção. `http://localhost` é aceito para desenvolvimento.
- O servidor precisa permanecer em execução durante os ciclos para disparar os avisos agendados.

### Configuração
1. Na raiz do projeto, instale as dependências: `npm install`.
2. Gere as chaves VAPID: `npx web-push generate-vapid-keys`.
3. Copie `.env.example` para `.env` e preencha `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` com as chaves/dados gerados.
4. Inicie o servidor: `npm start`.
5. Acesse `http://localhost:3000/pages/pomodoro.html`.
6. Clique em **Ativar notificações** e permita as notificações no navegador.
7. Configure os tempos e inicie o Pomodoro. O servidor enviará um aviso ao final do trabalho e outro ao final do descanso, repetindo os ciclos enquanto o temporizador estiver ativo.

### Observações
- Não abra as páginas diretamente pelo protocolo `file://` nem use apenas uma extensão de servidor estático: o Web Push depende das rotas da API e do Service Worker servido pelo mesmo domínio.
- As inscrições e os agendamentos são mantidos em memória pelo servidor. Se o servidor for reiniciado, será necessário abrir o Pomodoro novamente para sincronizar a inscrição e o ciclo ativo.
- Nunca compartilhe o arquivo `.env` nem publique a chave VAPID privada.
