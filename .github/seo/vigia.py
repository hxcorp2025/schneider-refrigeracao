# -*- coding: utf-8 -*-
"""Vigia de SEO do site da Schneider Refrigeração.

Roda a cada envio (ver .github/workflows/seo.yml) e na mão antes de publicar:

    python .github/seo/vigia.py               confere o site contra o retrato guardado
    python .github/seo/vigia.py --atualizar   grava o retrato novo (mudança feita de propósito)
    python .github/seo/vigia.py --tabela      mostra a tabela de páginas (título, tamanho, palavras)

Só usa a biblioteca padrão do Python. Sai com código 1 quando acha problema CRÍTICO.
"""
import difflib
import io
import json
import os
import re
import sys
from html.parser import HTMLParser

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RETRATO = os.path.join(os.path.dirname(__file__), "retrato.json")
DOMINIO = "https://refrigeracaoschneider.com.br"
ID_NEGOCIO = DOMINIO + "/#business"
FORA_DO_INDICE = {"/404.html"}          # páginas que não entram no sitemap
TITULO_MAX_NOVO = 60                    # régua pra página nova; antigas que ranqueiam ficam como estão
DESC_MIN, DESC_MAX = 110, 165
PISO_PALAVRAS_CIDADE = 500
TETO_TEXTO_IGUAL = 0.45                 # acima disso, página de cidade parece cópia de outra

CIDADES = {
    "ar-condicionado-alvorada": "Alvorada", "ar-condicionado-cachoeirinha": "Cachoeirinha",
    "ar-condicionado-campo-bom": "Campo Bom", "ar-condicionado-canoas": "Canoas",
    "ar-condicionado-capao-da-canoa": "Capão da Canoa", "ar-condicionado-esteio": "Esteio",
    "ar-condicionado-gravatai": "Gravataí", "ar-condicionado-novo-hamburgo": "Novo Hamburgo",
    "ar-condicionado-porto-alegre": "Porto Alegre", "ar-condicionado-sao-leopoldo": "São Leopoldo",
    "ar-condicionado-sapiranga": "Sapiranga", "ar-condicionado-sapucaia-do-sul": "Sapucaia do Sul",
    "ar-condicionado-viamao": "Viamão",
}


class Leitor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta = {}
        self.canonical = None
        self.h = {"h1": [], "h2": []}
        self.links = []
        self.imgs = []
        self.ld = []
        self.main_txt = []
        self._pilha = []
        self._buf = None
        self._em_main = 0
        self._ld = None
        self._pular = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._buf = ("title", [])
        elif tag == "meta":
            chave = a.get("name") or a.get("property")
            if chave:
                self.meta[chave.lower()] = a.get("content", "")
        elif tag == "link" and (a.get("rel") or "").lower() == "canonical":
            self.canonical = a.get("href")
        elif tag in ("h1", "h2"):
            self._buf = (tag, [])
        elif tag == "a" and a.get("href"):
            self.links.append((a["href"], bool(self._em_main)))
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "main":
            self._em_main += 1
        elif tag == "script":
            if (a.get("type") or "").lower() == "application/ld+json":
                self._ld = []
            else:
                self._pular += 1
        elif tag in ("style", "svg"):
            self._pular += 1

    def handle_endtag(self, tag):
        if self._buf and tag == self._buf[0]:
            txt = re.sub(r"\s+", " ", "".join(self._buf[1])).strip()
            if tag == "title":
                self.title = txt
            else:
                self.h[tag].append(txt)
            self._buf = None
        elif tag == "main":
            self._em_main = max(0, self._em_main - 1)
        elif tag == "script":
            if self._ld is not None:
                self.ld.append("".join(self._ld))
                self._ld = None
            else:
                self._pular = max(0, self._pular - 1)
        elif tag in ("style", "svg"):
            self._pular = max(0, self._pular - 1)

    def handle_data(self, data):
        if self._ld is not None:
            self._ld.append(data)
            return
        if self._pular:
            return
        if self._buf:
            self._buf[1].append(data)
        if self._em_main:
            self.main_txt.append(data)


def paginas():
    achadas = {}
    for pasta, sub, arqs in os.walk(RAIZ):
        sub[:] = [s for s in sub if not s.startswith(".") and s not in ("node_modules",)]
        for a in arqs:
            if not a.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(pasta, a), RAIZ).replace(os.sep, "/")
            url = "/" + (rel[:-len("index.html")] if rel.endswith("index.html") else rel)
            achadas[url] = os.path.join(pasta, a)
    return achadas


def tipos_ld(obj, acc, ids):
    if isinstance(obj, dict):
        t = obj.get("@type")
        if t:
            acc.extend(t if isinstance(t, list) else [t])
        if obj.get("@type") == "HVACBusiness":
            ids.append(obj.get("@id"))
        for v in obj.values():
            tipos_ld(v, acc, ids)
    elif isinstance(obj, list):
        for v in obj:
            tipos_ld(v, acc, ids)


def ler(url, caminho):
    html = io.open(caminho, encoding="utf-8").read()
    p = Leitor()
    p.feed(html)
    problemas = []
    tipos, ids = [], []
    for bloco in p.ld:
        try:
            tipos_ld(json.loads(bloco), tipos, ids)
        except ValueError as e:
            problemas.append(("CRITICO", "dado estruturado não é JSON válido: %s" % str(e)[:60]))
    texto = re.sub(r"\s+", " ", " ".join(p.main_txt)).strip()
    return {
        "titulo": p.title,
        "descricao": p.meta.get("description", ""),
        "canonical": p.canonical,
        "robots": p.meta.get("robots", ""),
        "h1": p.h["h1"],
        "h2": p.h["h2"],
        "tipos": sorted(set(tipos)),
        "ids_negocio": ids,
        "og_title": p.meta.get("og:title", ""),
        "og_image": p.meta.get("og:image", ""),
        "links_internos_no_texto": sum(1 for h, m in p.links if m and (h.startswith("/") or h.startswith(DOMINIO))),
        "palavras": len(texto.split()),
        "_links": [h for h, _ in p.links],
        "_imgs": p.imgs,
        "_texto": texto,
        "_problemas": problemas,
    }


def alvo_existe(href, mapa):
    h = href.split("#")[0].split("?")[0]
    if h.startswith(DOMINIO):
        h = h[len(DOMINIO):] or "/"
    if not h.startswith("/"):
        return True                      # externo, âncora, tel:, wa.me
    if h in mapa:
        return True
    return os.path.exists(os.path.join(RAIZ, h.lstrip("/").replace("/", os.sep)))


def texto_cidade(slug, dados):
    t = dados["_texto"]
    return re.sub(re.escape(CIDADES[slug]), "CIDADE", t, flags=re.I).split()


def conferir(mapa, lidas):
    achados = []                         # (gravidade, url, mensagem)

    def add(g, u, m):
        achados.append((g, u, m))

    sitemap = io.open(os.path.join(RAIZ, "sitemap.xml"), encoding="utf-8").read()
    locs = [l[len(DOMINIO):] or "/" for l in re.findall(r"<loc>(.*?)</loc>", sitemap)]
    for l in locs:
        if l not in mapa:
            add("CRITICO", l, "está no sitemap e não existe no site")
    titulos, descricoes = {}, {}
    for url, d in sorted(lidas.items()):
        for g, m in d["_problemas"]:
            add(g, url, m)
        indexavel = url not in FORA_DO_INDICE and "noindex" not in d["robots"].lower()
        if "noindex" in d["robots"].lower() and url not in FORA_DO_INDICE:
            add("CRITICO", url, "está com noindex")
        if indexavel and url not in locs:
            add("AVISO", url, "página indexável fora do sitemap")
        if not d["titulo"]:
            add("CRITICO", url, "sem título")
        if len(d["h1"]) != 1 and url not in FORA_DO_INDICE:
            add("CRITICO", url, "tem %d H1 (precisa de exatamente 1)" % len(d["h1"]))
        if indexavel:
            esperado = DOMINIO + url
            if d["canonical"] != esperado:
                add("CRITICO", url, "canonical aponta pra %s" % d["canonical"])
            if not (DESC_MIN <= len(d["descricao"]) <= DESC_MAX):
                add("INFO", url, "descrição com %d caracteres (régua %d a %d)" % (len(d["descricao"]), DESC_MIN, DESC_MAX))
            if not d["tipos"]:
                add("CRITICO", url, "sem dado estruturado")
            for i in d["ids_negocio"]:
                if i != ID_NEGOCIO:
                    add("AVISO", url, "negócio no dado estruturado sem o @id oficial (%s)" % i)
            titulos.setdefault(d["titulo"], []).append(url)
            descricoes.setdefault(d["descricao"], []).append(url)
        for h in d["_links"]:
            if not alvo_existe(h, mapa):
                add("CRITICO", url, "link interno quebrado: %s" % h)
        for im in d["_imgs"]:
            if "alt" not in im:
                add("AVISO", url, "imagem sem alt: %s" % im.get("src"))
            if not (im.get("width") and im.get("height")):
                add("INFO", url, "imagem sem largura e altura: %s" % im.get("src"))
    for t, us in titulos.items():
        if len(us) > 1:
            add("CRITICO", us[0], "título repetido em %s" % ", ".join(us[1:]))
    for t, us in descricoes.items():
        if t and len(us) > 1:
            add("AVISO", us[0], "descrição repetida em %s" % ", ".join(us[1:]))

    # teste da troca de cidade: nenhuma página de cidade pode ser cópia de outra
    slugs = [s for s in CIDADES if "/%s/" % s in lidas]
    textos = {s: texto_cidade(s, lidas["/%s/" % s]) for s in slugs}
    for s in slugs:
        d = lidas["/%s/" % s]
        if d["palavras"] < PISO_PALAVRAS_CIDADE:
            add("AVISO", "/%s/" % s, "página de cidade com %d palavras (piso %d)" % (d["palavras"], PISO_PALAVRAS_CIDADE))
        pior, quem = 0.0, None
        for o in slugs:
            if o == s:
                continue
            r = difflib.SequenceMatcher(None, textos[s], textos[o], autojunk=False).ratio()
            if r > pior:
                pior, quem = r, o
        d["texto_igual_max"] = round(pior, 2)
        d["texto_igual_com"] = quem
        if pior > TETO_TEXTO_IGUAL:
            add("AVISO", "/%s/" % s, "%d%% do texto igual ao de /%s/ trocando o nome da cidade (teto %d%%)"
                % (round(pior * 100), quem, round(TETO_TEXTO_IGUAL * 100)))
    return achados


def publico(d):
    return {k: v for k, v in d.items() if not k.startswith("_")}


def comparar(antes, agora):
    achados = []
    for url in sorted(antes):
        if url not in agora:
            achados.append(("CRITICO", url, "página sumiu do site"))
            continue
        a, n = antes[url], agora[url]
        if a.get("titulo") != n["titulo"]:
            achados.append(("AVISO", url, "título mudou: «%s» → «%s»" % (a.get("titulo"), n["titulo"])))
        if a.get("h1") != n["h1"]:
            achados.append(("AVISO", url, "H1 mudou: %s → %s" % (a.get("h1"), n["h1"])))
        if a.get("canonical") != n["canonical"]:
            achados.append(("CRITICO", url, "canonical mudou"))
        perdidos = sorted(set(a.get("tipos", [])) - set(n["tipos"]))
        if perdidos:
            achados.append(("CRITICO", url, "dado estruturado perdeu: %s" % ", ".join(perdidos)))
        if a.get("descricao") != n["descricao"]:
            achados.append(("INFO", url, "descrição mudou"))
        if n["links_internos_no_texto"] < a.get("links_internos_no_texto", 0):
            achados.append(("AVISO", url, "links internos no texto caíram de %d pra %d"
                            % (a["links_internos_no_texto"], n["links_internos_no_texto"])))
        if a.get("palavras") and n["palavras"] < a["palavras"] * 0.8:
            achados.append(("AVISO", url, "texto encolheu de %d pra %d palavras" % (a["palavras"], n["palavras"])))
    for url in sorted(set(agora) - set(antes)):
        achados.append(("INFO", url, "página nova (entra no retrato com --atualizar)"))
    return achados


def main():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except Exception:
            pass
    mapa = paginas()
    lidas = {u: ler(u, c) for u, c in mapa.items()}
    achados = conferir(mapa, lidas)
    agora = {u: publico(d) for u, d in lidas.items()}

    if "--tabela" in sys.argv:
        for u, d in sorted(agora.items()):
            extra = ""
            if "texto_igual_max" in d:
                extra = " | %d%% igual a %s" % (round(d["texto_igual_max"] * 100), d["texto_igual_com"].replace("ar-condicionado-", ""))
            print("%-42s tít %3d | desc %3d | %4d palavras | %2d links no texto%s"
                  % (u, len(d["titulo"]), len(d["descricao"]), d["palavras"], d["links_internos_no_texto"], extra))
        return 0

    if "--atualizar" in sys.argv:
        with io.open(RETRATO, "w", encoding="utf-8", newline="\n") as f:
            json.dump(agora, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.write("\n")
        print("Retrato gravado: %d páginas." % len(agora))
    elif os.path.exists(RETRATO):
        antes = json.load(io.open(RETRATO, encoding="utf-8"))
        achados += comparar(antes, agora)
    else:
        print("Ainda não existe retrato. Rode com --atualizar.")

    ordem = {"CRITICO": 0, "AVISO": 1, "INFO": 2}
    achados.sort(key=lambda x: (ordem[x[0]], x[1]))
    mostrar_info = "--tudo" in sys.argv
    for g, u, m in achados:
        if g == "INFO" and not mostrar_info:
            continue
        print("[%s] %s  %s" % (g, u, m))
    n = {g: sum(1 for a in achados if a[0] == g) for g in ordem}
    print("\n%d páginas | %d críticos | %d avisos | %d informações%s"
          % (len(agora), n["CRITICO"], n["AVISO"], n["INFO"], "" if mostrar_info else " (use --tudo pra ver)"))
    return 1 if n["CRITICO"] else 0


if __name__ == "__main__":
    sys.exit(main())
