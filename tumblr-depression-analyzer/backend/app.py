from flask import Flask
from flask_cors import CORS
from backend.routes.fetch_posts import fetch_posts_bp
from backend.routes.get_importance import get_importance_bp  # Importa el nuevo blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(fetch_posts_bp)

if __name__ == '__main__':
    app.run(debug=True)
