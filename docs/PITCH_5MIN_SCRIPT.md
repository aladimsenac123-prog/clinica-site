# 🎤 Roteiro de Apresentação (Pitch Técnico de 5 Minutos)
### BioHealth Labs — Sistema de Acesso Biométrico Facial com IA

Este roteiro foi formatado para que a equipe apresente o projeto em **5 minutos cravados**, demonstrando competência técnica, domínio da IA, segurança anti-spoofing e compliance LGPD.

---

### ⏱️ Minuto 1: O Problema & A Dor do Negócio (00:00 - 01:00)
* **Apresentador 1:**
  > *"Boa noite a todos! Recentemente, nosso laboratório de pesquisas clínicas enfrentou um incidente crítico de segurança: funcionários estavam compartilhando crachás e senhas para bater ponto e acessar áreas de risco biológico Nível 4.  
  > Crachás são transferíveis, senhas são esquecíveis e compartilháveis. A diretoria nos fez uma exigência direta: **'Você deve ser a sua própria senha'**."*
* **Ação no telão:** Mostrar a Landing Page institucional (`/`) com os tokens do Asimov Design System e destacar o slogan *"Você é a sua própria senha"*.

---

### ⏱️ Minuto 2: Demonstração ao Vivo — Cadastro Biométrico & LGPD (01:00 - 02:00)
* **Apresentador 2:**
  > *"Desenvolvemos uma solução web moderna onde o processamento de visão computacional ocorre 100% no navegador do usuário através do `face-api.js` acelerado por WebGL."*
* **Ação no telão:**
  1. Acessar `/cadastro`.
  2. Enquadrar o rosto na câmera, mostrar os **68 marcos anatômicos (*landmarks*)** sendo traçados em tempo real na tela.
  3. Clicar em **'Extrair Biometria do Rosto'** (ouvir o bip de confirmação).
  4. Mostrar o parágrafo explicativo da **LGPD (Art. 11, II, g)** e assinalar o consentimento:
     > *"Notem que o sistema não faz upload de nenhuma foto. Geramos apenas um vetor matemático unidirecional de 128 dimensões decimais criptografado."*
  5. Clicar em **'Finalizar Cadastro'**.

---

### ⏱️ Minuto 3: Login Facial Instantâneo & Desbloqueio do Painel (02:00 - 03:00)
* **Apresentador 1:**
  > *"Agora vamos para a entrada da área restrita do laboratório."*
* **Ação no telão:**
  1. Acessar `/login`.
  2. O sistema detecta o rosto, calcula a distância Euclidiana ($d < 0.40$), exibe a taxa de confiança de $98\%$ e realiza o desbloqueio automático.
  3. Redirecionamento instantâneo para o **Painel Secreto (`/dashboard`)**.
  4. Mostrar os ensaios clínicos confidenciais e o log de auditoria em tempo real.

---

### ⏱️ Minuto 4: O Teste de Ataque de Spoofing & Prova de Vida (03:00 - 04:00)
* **Apresentador 2 (Ponto Alto da Apresentação):**
  > *"Mas e se um invasor colocar uma foto impressa ou a tela de um celular na frente da câmera para tentar burlar o sistema?  
  > Implementamos um motor de **Liveness Detection (Prova de Vida)** baseado no cálculo do Eye Aspect Ratio (EAR) e micro-movimentos faciais."*
* **Ação no telão:**
  1. Voltar à tela de `/login`.
  2. Clicar no botão de teste **'Simular Ataque de Foto Estática'** (ou colocar uma foto estática na frente da webcam).
  3. Mostrar o HUD alertando em vermelho: **"Ataque de Spoofing Detectado: Prova de Vida Reprovada"**.
  4. Desativar a simulação, piscar os olhos diante da câmera e mostrar a aprovação imediata: **"✓ Prova de Vida Aprovada (Humano Real)"**.

---

### ⏱️ Minuto 5: Conclusão, Segurança e LGPD (04:00 - 05:00)
* **Apresentador 1:**
  > *"Para encerrar, respondendo aos pilares de segurança e LGPD:  
  > 1. Se a câmera estiver embaçada, nosso pré-processamento descarta o frame e avisa o usuário, evitando falsos acessos.  
  > 2. Fotos impressas são barradas pelo algoritmo EAR de prova de vida.  
  > 3. E sob a LGPD (Art. 18), o funcionário pode a qualquer momento clicar em 'Excluir Minha Biometria' para eliminar definitivamente seu registro.  
  > Eliminamos as fraudes de crachá com uma solução ágil, segura e 100% aderente à lei. Obrigado!"*
* **Ação no telão:** Mostrar o botão de exclusão de biometria no `/dashboard` e finalizar com aplausos.
