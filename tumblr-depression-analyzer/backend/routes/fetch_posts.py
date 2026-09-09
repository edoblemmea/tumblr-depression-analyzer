from flask import Blueprint, request, jsonify
from backend.utils.tumblr_api import get_tagged_posts #, get_blog_posts, get_community_posts
import pandas as pd
from bs4 import BeautifulSoup
from backend.ml.predict import predict_posts, model, device
import langid
import time

fetch_posts_bp = Blueprint('fetch_posts', __name__)
max_iterations = 10
@fetch_posts_bp.route('/api/fetch-posts', methods=['POST'])
def fetch_posts():
    print(">> Se llamó al endpoint /api/fetch-posts")
    data = request.get_json()
    print("Datos recibidos:", data)
    source_type = data.get('sourceType')
    input_value = data.get('inputValue')
    nr_posts = int(data.get('nrPosts', 20))  # default 20 si no se especifica
    start_date = data.get('startDate')  # aún no se usa
    all_posts = []

    try:
        if source_type == 'tag':
            iterations = 0
            before = None
            all_posts = []

            # Inicializar aquí, fuera del while
            textos_validos = []
            df = pd.DataFrame(columns=["texto", "tags"])
            usados = set()
            start_fetch = time.time()
            print(f"→ Inicializando recolección. nr_posts requeridos: {nr_posts}, ya hay {len(textos_validos)} válidos.")
            while len(textos_validos) < nr_posts and iterations < max_iterations:
                iterations += 1
                # Solo hacer fetch si es la primera vez o si hace falta más
                if not all_posts:
                    response = get_tagged_posts(input_value, limit=min(20, nr_posts), before=before)
                    if response is None:
                        print("Error: get_tagged_posts devolvió None")
                        break
                    new_posts = response.get('response', [])
                    if not new_posts:
                        print("No hay posts disponibles inicialmente.")
                        break
                    all_posts.extend(new_posts)
                    before = new_posts[-1]['timestamp']

                for i, post in enumerate(all_posts):
                    if i in usados:
                        continue
                    content = getContent(post)
                    lang, conf = langid.classify(content)
                    if content and content.strip() and lang=="en":
                        usados.add(i)
                        df.loc[len(df)] = {
                            'texto': content,
                            'tags': ", ".join(post.get('tags', []))
                        }
                        textos_validos.append(content)

                    if len(textos_validos) >= nr_posts:
                        break

                if len(textos_validos) < nr_posts:
                    print(f"Faltan {nr_posts - len(textos_validos)} textos válidos, recolectando más...")
                    remaining = nr_posts - len(textos_validos)
                    response = get_tagged_posts(input_value, limit=remaining, before=before)
                    new_posts = response.get('response', [])
                    if not new_posts:
                        print("No se encontraron más posts.")
                        break
                    all_posts.extend(new_posts)
                    before = new_posts[-1]['timestamp']
                else:
                    break  # Ya tenemos suficientes posts válidos

            print(f"Total textos válidos: {len(textos_validos)}")
            df.to_json("posts_tumblr.json", orient="records", indent=2, force_ascii=False)
            end_fetch = time.time()
            fetch_duration = end_fetch - start_fetch
            print(f"Tiempo de recolección para {nr_posts} posts: {fetch_duration:.2f} segundos")
            # Predicción
            start_predict = time.time()
            resultados = predict_posts(textos_validos, model, device)
            end_predict = time.time()
            predict_duration = end_predict - start_predict
            print(f"Tiempo de predicción para {nr_posts} posts: {predict_duration:.2f} segundos")
            return jsonify(resultados)
        
        elif source_type == 'csv':
            print("→ Procesando archivo CSV")
            if 'file' not in request.files:
                return jsonify({'error': 'Archivo no encontrado'}), 400
            file = request.files['file']
            df_csv = pd.read_csv(file)
            if 'texto' not in df_csv.columns:
                return jsonify({'error': 'El archivo debe contener una columna "texto"'}), 400

            for _, row in df_csv.iterrows():
                content = str(row['texto'])
                lang, conf = langid.classify(content)
                if content.strip() and lang == "en":
                    textos_validos.append(content)

            df = df_csv


    except Exception as e:
        print("ERROR:", e)
        return jsonify({'error': str(e)}), 500

def clean_html(html_text):
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(separator="\n").strip()

def getContent(post):
    content_raw=post.get('trail', "")
    if content_raw=="" or len(content_raw)==0: return None
    elif type(content_raw)!=list:
        soup = BeautifulSoup(content_raw, "html.parser")
        return soup.get_text(separator=" ", strip=True)
    else:
        soup = BeautifulSoup(content_raw[0]['content_raw'], "html.parser")
        return soup.get_text(separator=" ", strip=True)