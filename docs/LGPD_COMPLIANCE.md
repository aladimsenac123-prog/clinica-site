# 🛡️ Relatório de Conformidade com a LGPD (Lei nº 13.709/2018)
### Sistema de Controle de Acesso Biométrico Facial — BioHealth Research Labs

---

## 1. Enquadramento Legal dos Dados Biométricos

De acordo com o **Art. 5º, Inciso II da LGPD**, dados biométricos são classificados como **Dados Pessoais Sensíveis**:
> *"Art. 5º, II - dado pessoal sensível: dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, **dado genético ou biométrico, quando vinculado a uma pessoa natural**;"*

Para o tratamento de dados biométricos em ambiente laboratorial/hospitalar restrito, a base legal utilizada é o **Art. 11, Inciso II, alínea "g" da LGPD**:
> *"Art. 11. O tratamento de dados pessoais sensíveis somente poderá ocorrer nas seguintes hipóteses: [...]  
> II - sem fornecimento de consentimento do titular, nas hipóteses em que for indispensável para: [...]  
> **g) garantia da prevenção à fraude e à segurança do titular, nos processos de identificação e autenticação de cadastro em sistemas eletrônicos**[...]"*

Embora a lei permita a dispensa do consentimento para prevenção a fraudes corporativas, o sistema da BioHealth Labs adota a prática de **Privacidade Máxima (*Privacy by Default*)**, coletando também o consentimento explícito e informado na tela de cadastro.

---

## 2. Princípio da Minimização de Dados e Vetorização Unidirecional

Um dos maiores erros em sistemas biométricos legados é salvar a foto do rosto em arquivos JPEG/PNG ou no banco de dados. 

### Nossa Abordagem Técnica:
1. **Zero Retenção de Imagens:** Nenhuma foto é transmitida pela rede nem gravada em disco.
2. **Descritores Numéricos de 128 Dimensões:** A rede neural profunda (`faceRecognitionNet`) extrai apenas uma matriz unidirecional de 128 valores em ponto flutuante ($v \in \mathbb{R}^{128}$).
3. **Impossibilidade de Reconstrução Facial (*One-Way Vector*):** O vetor biométrico é uma função matemática irreversível. Mesmo em caso de vazamento da base de dados, um invasor não consegue reconstruir os traços faciais ou a fotografia original do funcionário.

---

## 3. Direitos do Titular (LGPD Art. 18)

O sistema implementa de ponta a ponta as garantias legais:
* **Art. 18, I e II (Acesso e Confirmação):** O usuário visualiza seus dados cadastrais e índice de confiança biométrica no Painel do Usuário.
* **Art. 18, VI (Direito à Eliminação):** Botão nativo no Painel Secreto que permite ao profissional revogar sua biometria e **eliminar permanentemente seu vetor de 128 floats** da base de dados com 1 clique.
* **Art. 18, IX (Rastreabilidade):** Cada acesso, tentativa de login e alteração de cadastro gera um registro imutável no Log de Auditoria com timestamp, IP e base legal.

---

## 4. Texto Oficial do Termo de Uso Integrado na Aplicação

> *"**Termo de Uso e Privacidade (LGPD):** Os dados biométricos coletados por este sistema são estritamente utilizados para fins de autenticação de segurança e controle de acesso a áreas restritas deste laboratório, com base no Art. 11, II, 'g' da Lei Geral de Proteção de Dados (LGPD). Informamos que a sua fotografia **não** é armazenada; registramos apenas um código numérico criptografado (vetor matemático dos pontos biométricos) impossível de ser revertido em imagem fotográfica. Você pode solicitar a exclusão do seu registro biométrico a qualquer momento junto ao DPO/administração."*
