# Schneider Refrigeração — refrigeracaoschneider.com.br

Site institucional de alta conversão para WhatsApp. Estático (HTML/CSS/JS puro), hospedado no GitHub Pages.

## Estrutura

```
/                               Home (keyword: ar condicionado porto alegre)
/instalacao-de-ar-condicionado/ Página de serviço + LP pro Google Ads
/limpeza-e-higienizacao/        Página de serviço + LP pro Google Ads
/manutencao-e-conserto/         Página de serviço + LP pro Google Ads
/carga-de-gas/                  Página de serviço + LP pro Google Ads
/ar-quente-no-inverno/          Artigo SEO (ângulo inverno / economia)
```

Todos os CTAs apontam pro WhatsApp (51) 98580-1284 com mensagem pré-preenchida
específica de cada página — o lead já chega dizendo o que quer.

## DNS na Hostinger (fazer 1x)

No painel da Hostinger → Domínios → refrigeracaoschneider.com.br → DNS / Nameservers:

1. **Apagar** qualquer registro `A` ou `CNAME` existente de `@` e `www` (ex.: parking).
2. Criar **4 registros A** para o host `@`:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Criar **1 registro CNAME**: host `www` → `hxcorp2025.github.io`
4. Aguardar propagação (minutos até ~24h).
5. No GitHub: Settings → Pages → conferir custom domain `refrigeracaoschneider.com.br` e marcar **Enforce HTTPS** (o checkbox libera depois que o certificado é emitido, pode levar ~1h após a propagação).

## Google Ads / GA4 (quando for rodar tráfego)

1. Criar a tag do Google (GA4 ou Google Ads) e copiar o snippet `gtag.js`.
2. Colar o snippet no `<head>` de **todas** as páginas, onde está o comentário
   `<!-- GOOGLE ADS / GA4: ... -->`.
3. O evento de conversão **`click_whatsapp`** já dispara sozinho em todo clique
   de botão de WhatsApp (código em `js/main.js`), com o rótulo do botão
   (`hero`, `cta-final`, `float`, `mobile-bar`, etc.) e a página.
4. No Google Ads: Metas → Conversões → criar conversão a partir do evento
   `click_whatsapp` (via GA4) e usar como meta das campanhas.
5. Estrutura recomendada de campanha: **1 grupo de anúncio por página de serviço**
   (instalação, limpeza, manutenção, carga de gás), cada um apontando pra
   respectiva URL. O texto do anúncio deve repetir o H1 da página (message match).

## Google Business Profile (maior alavanca de SEO local — grátis)

1. Acessar https://business.google.com com a conta Google do negócio.
2. Criar o perfil "Schneider Refrigeração" — categoria **"Empresa de ar-condicionado"**
   (secundárias: "Serviço de conserto de ar-condicionado", "Empresa de refrigeração").
3. Área de atendimento: Porto Alegre + cidades da região metropolitana (sem endereço público).
4. Telefone: (51) 98580-1284 · Site: https://refrigeracaoschneider.com.br
5. Preencher serviços, horário e fotos reais de serviços feitos.
6. **Pedir avaliação no Google pra todo cliente atendido** (mandar o link de avaliação
   no WhatsApp após o serviço). É o fator nº 1 de ranqueamento no mapa.

## Pendências de conteúdo

- **Depoimentos:** a seção existe na home, comentada (`<!-- ============ DEPOIMENTOS`).
  Colher 3 avaliações reais (print de WhatsApp ou Google) e descomentar o bloco.
- **Fotos reais:** as fotos atuais são de banco de imagem (Pexels, licença livre,
  IDs 5813738 e 32588555). Quando houver fotos reais de serviços da Schneider,
  substituir — foto real converte mais.

## Como editar

- Textos: direto nos `index.html` de cada pasta.
- Estilos: `css/style.css` (variáveis de cor no `:root`).
- Novas imagens: converter pra WebP (~80KB máx) e colocar em `img/`.
- Publicar: `git add -A && git commit -m "..." && git push` — o GitHub Pages
  atualiza sozinho em ~1 min.
