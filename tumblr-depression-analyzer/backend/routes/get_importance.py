from flask import Blueprint, request, jsonify
from backend.ml.predict import (
    model,
    tokenizer,
    device,
    interpret_prediction,
    importancia_palabras,
)

get_importance_bp = Blueprint('get_importance_bp', __name__)

@get_importance_bp.route('/api/get-importance', methods=['POST'])
def get_importance():
    data = request.json
    text = data.get("text")
    target_label = data.get("target_label")

    if not text or target_label is None:
        return jsonify({"error": "Faltan datos"}), 400

    attributions, input_ids = interpret_prediction(text, model, tokenizer, device, target_label)
    tokens_with_scores = importancia_palabras(attributions, input_ids, tokenizer)

    return jsonify({"tokensWithScores": tokens_with_scores})