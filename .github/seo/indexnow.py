# -*- coding: utf-8 -*-
"""Avisa Bing, Yandex, Seznam, Naver e Yep (protocolo IndexNow) das páginas que mudaram.

O Google NÃO participa do IndexNow: pra ele continua valendo sitemap + pedido manual no Search Console.

    python .github/seo/indexnow.py            envia as páginas com lastmod de hoje ou de ontem no sitemap
    python .github/seo/indexnow.py --todas    envia todas as páginas do sitemap
    python .github/seo/indexnow.py --seco     só mostra o que enviaria

A chave é o nome do arquivo <32 letras e números>.txt na raiz do site. Ela é pública de propósito:
é assim que o protocolo confere que quem avisa é o dono do site.
"""
import datetime
import io
import json
import os
import re
import sys
import urllib.request

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
HOST = "refrigeracaoschneider.com.br"


def main():
    chaves = [f[:-4] for f in os.listdir(RAIZ) if re.fullmatch(r"[0-9a-f]{32}\.txt", f)]
    if len(chaves) != 1:
        print("Esperava 1 arquivo de chave na raiz, achei %d." % len(chaves))
        return 1
    chave = chaves[0]
    xml = io.open(os.path.join(RAIZ, "sitemap.xml"), encoding="utf-8").read()
    pares = re.findall(r"<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>", xml, re.S)
    hoje = datetime.datetime.now(datetime.timezone.utc).date()
    corte = (hoje - datetime.timedelta(days=2)).isoformat()
    urls = [u for u, d in pares if "--todas" in sys.argv or d[:10] >= corte]
    if not urls:
        print("Nenhuma página com data recente no sitemap. Nada a enviar.")
        return 0
    corpo = {"host": HOST, "key": chave, "keyLocation": "https://%s/%s.txt" % (HOST, chave), "urlList": urls}
    print("IndexNow: %d página(s)" % len(urls))
    for u in urls:
        print("  ", u)
    if "--seco" in sys.argv:
        return 0
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=json.dumps(corpo).encode("utf-8"),
                                 headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("Resposta:", r.status, "(200 = recebido, 202 = recebido, chave ainda em conferência)")
            return 0
    except urllib.error.HTTPError as e:
        print("Recusado:", e.code, e.read().decode("utf-8", "replace")[:300])
        print("403 = a chave ainda não está no ar no site · 422 = endereço fora do domínio · 429 = muitos envios")
        return 1


if __name__ == "__main__":
    sys.exit(main())
