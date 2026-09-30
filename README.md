# 🏥 BioHealth Labs — Sistema de Controle de Acesso Biométrico Facial

Aplicação web para controle de acesso laboratorial restrito utilizando **Visão Computacional no Navegador** com `face-api.js`, **Liveness Detection (Anti-Spoofing)**, backend em **Node.js/Express**, e design refinado baseado no **Asimov Design System (Teal/Cyan Clinical Biotech)** e **Bootstrap 5**.

![BioHealth Labs Banner](public/css/asimov-tokens.css)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
* Node.js instalado (versão 18 ou superior recomendada)
* Navegador moderno com suporte a WebGL e permissão de Webcam (Chrome, Edge, Firefox, Safari)

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Iniciar o Servidor
```bash
npm start
```
*(Ou `node server.js`)*

### 4. Acessar a Aplicação
Abra seu navegador em:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Rotas Disponíveis

* **`/`** — Portal Institucional BioHealth Labs (Visão Geral de Segurança).
* **`/cadastro`** — Cadastro do Profissional de Saúde com extração biométrica (128D) e Termo de Consentimento LGPD.
* **`/login`** — Terminal de Reconhecimento Facial em tempo real com Prova de Vida (*Liveness Detection*) e Anti-Spoofing.
* **`/dashboard`** — Painel Secreto com protocolos clínicos confidenciais, métricas de biossegurança e Log de Auditoria LGPD.

---

## 🛡️ Pilares de Segurança e LGPD

1. **Zero Retenção de Imagens:** Não salvamos fotos brutas. Apenas vetores matemáticos unidirecionais de 128 dimensões numéricas.
2. **Anti-Spoofing (Prova de Vida):** O algoritmo de *Eye Aspect Ratio (EAR)* e rastreamento de micro-movimento impede fraudes com fotos impressas ou vídeos gravados.
3. **Direito à Eliminação (LGPD Art. 18):** O profissional pode revogar seu consentimento e excluir permanentemente seus dados biométricos a qualquer momento.

---

## 📚 Documentação Técnica Completa

* 📋 [Relatório de Conformidade LGPD](docs/LGPD_COMPLIANCE.md)
* 🔒 [Relatório de Segurança e Análise de Spoofing](docs/SECURITY_REPORT.md)
* 🎤 [Roteiro do Pitch de 5 Minutos para Apresentação](docs/PITCH_5MIN_SCRIPT.md)
