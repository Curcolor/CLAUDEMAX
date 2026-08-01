#!/usr/bin/env python3
"""Kernel de Kaggle que calcula embeddings BAAI/bge-m3 para el RAG de CLAUDEMAX.

Entrada: dataset de Kaggle (ver kernel-metadata.json -> dataset_sources) con un archivo
chunks.jsonl, una línea por chunk pendiente de vectorizar:

    {"i": <indice>, "text": "<contenido del chunk>"}

Salida: /kaggle/working/embeddings.jsonl, una línea por chunk, en el mismo formato que
espera kaggle-embed.mjs al leer la salida del kernel:

    {"i": <indice>, "v": [<1024 floats>]}

Se ejecuta como kernel de tipo "script" con GPU e Internet habilitados (necesarios para
descargar el modelo la primera vez). El dataset de entrada queda montado en modo
solo-lectura bajo /kaggle/input/<slug-del-dataset>/.
"""
import glob
import json

from FlagEmbedding import BGEM3FlagModel

BATCH_SIZE = 32
OUTPUT_PATH = "/kaggle/working/embeddings.jsonl"


def encontrar_chunks_jsonl():
    """Busca chunks.jsonl en cualquier dataset montado bajo /kaggle/input/."""
    candidatos = glob.glob("/kaggle/input/**/chunks.jsonl", recursive=True)
    if not candidatos:
        raise FileNotFoundError(
            "no se encontro chunks.jsonl en /kaggle/input/ - revisa dataset_sources "
            "en kernel-metadata.json"
        )
    return candidatos[0]


def main():
    ruta_entrada = encontrar_chunks_jsonl()
    print(f"leyendo chunks desde {ruta_entrada}")

    indices = []
    textos = []
    with open(ruta_entrada, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea:
                continue
            item = json.loads(linea)
            indices.append(item["i"])
            textos.append(item["text"])

    print(f"{len(textos)} chunks a vectorizar - cargando BAAI/bge-m3 (fp16)...")
    modelo = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

    print("calculando embeddings densos por lotes...")
    salida = modelo.encode(
        textos,
        batch_size=BATCH_SIZE,
        max_length=8192,
        return_dense=True,
        return_sparse=False,
        return_colbert_vecs=False,
    )
    vectores = salida["dense_vecs"]

    print(f"escribiendo {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for idx, vec in zip(indices, vectores):
            f.write(json.dumps({"i": idx, "v": [float(x) for x in vec]}) + "\n")

    print("listo.")


if __name__ == "__main__":
    main()
