# NutriAli — site institucional

Site de apresentação da empresa e do app NutriAli, com animações 3D (Three.js).
É um site estático: só HTML, CSS e JavaScript, sem build.

## Publicação

O site roda na VPS da Hostinger, no projeto Docker `nutriali-site`:
um container baixa os arquivos deste repositório e um nginx os serve.
O Traefik da VPS cuida do endereço e do HTTPS.

## Como atualizar

1. Envie os arquivos alterados para este repositório (branch `main`).
2. Na Hostinger, abra **VPS → Docker Manager → nutriali-site** e clique em **Reiniciar**.
   O projeto baixa a versão nova do GitHub ao reiniciar.

## Onde mudar o quê

- Textos e seções: `index.html`
- Cores e layout: `css/styles.css`
- Endereço do app (botões "Entrar" e "Testar grátis"): `APP_URL` no começo de `js/main.js`
- Cenas 3D: `js/three/`
