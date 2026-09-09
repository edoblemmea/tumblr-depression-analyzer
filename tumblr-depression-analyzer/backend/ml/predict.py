import torch
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
import numpy as np
from transformers import DistilBertModel
import torch.nn as nn
import os
import torch
from captum.attr import Saliency

class DistilBERTClass(nn.Module):
    def __init__(self, num_labels=10, freeze_base_model=True):
        super(DistilBERTClass, self).__init__()
        self.base_model = DistilBertModel.from_pretrained("distilbert-base-uncased")

        if freeze_base_model:
            for param in self.base_model.parameters():
                param.requires_grad = False

        self.pre_classifier = nn.Linear(768, 768)
        self.activation = nn.Tanh()
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, num_labels)

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        outputs = self.base_model(input_ids=input_ids, attention_mask=attention_mask)
        hidden_state = outputs.last_hidden_state
        pooled_output = hidden_state[:, 0]

        x = self.pre_classifier(pooled_output)
        x = self.activation(x)
        x = self.dropout(x)
        x = self.classifier(x)
        return x
    
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # ruta del script actual
modelo_path = os.path.join(BASE_DIR, "pytorch_distilbert_news_state_dict.bin")
model = DistilBERTClass(num_labels=10)
model.load_state_dict(torch.load(modelo_path))
device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

def predict_posts(texts, model, device):
    model.eval()
    model.to(device)

    results = []

    for text in texts:
        # Etiquetas
        inputs = tokenizer(text, padding=True, truncation=True, max_length=512, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            logits = model(**inputs)
            probs = torch.sigmoid(logits).cpu().numpy()[0]
            pred = (probs > 0.5).astype(int).tolist()

        # 🔍 Saliency map por palabra
        attributions, input_ids = interpret_prediction(
            text,
            model,
            tokenizer,
            device,
            target_label=None  # o el índice de la clase que quieras analizar
        )
        tokens_with_scores = importancia_palabras(attributions, input_ids, tokenizer)
        tokens_with_scores = merge_word_pieces(tokens_with_scores)

        results.append({
            "texto": text,
            "labels": pred,
            "probs": probs.tolist(),
            "tokensWithScores": tokens_with_scores
        })

    return results



def interpret_prediction(text, model, tokenizer, device, target_label=None):
    model.to(device)
    model.eval()

    # Tokenize input and move to device
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs["attention_mask"].to(device)

    # Get embedding layer and generate embeddings
    embedding_layer = model.base_model.get_input_embeddings()
    embeddings = embedding_layer(input_ids)
    embeddings = embeddings.detach().clone().requires_grad_(True).to(device)

    # Define custom forward function
    def forward_func(embeds):
        # forward with embeddings instead of input_ids
        outputs = model.base_model(inputs_embeds=embeds, attention_mask=attention_mask)
        hidden_state = outputs.last_hidden_state
        pooled_output = hidden_state[:, 0]

        x = model.pre_classifier(pooled_output)
        x = model.activation(x)
        x = model.dropout(x)
        logits = model.classifier(x)

        if target_label is None:
            return logits[:, logits.argmax(dim=-1)]
        else:
            return logits[:, target_label]

    # Compute saliency
    saliency = Saliency(forward_func)
    attributions = saliency.attribute(embeddings)

    return attributions, input_ids

'''
attributions, input_ids = interpret_prediction(
    "People that tell you to have good nutrition and exercise when your mentally ill are dumbI work in Mental Health. For some reason the health care system keeps vouching for good Nutrition, exercise, and drink lots of water when your depressed or suicidal .... Have any of you been recommend this advice???? Like I'm gonna be straight up and say that those are nice things. But when many of my clients are too poor to afford good food or a gym membership, it's kinda insulting. In addition, many people are dealing with depression and such, where getting out of bed is just difficult. People I work with telling patients that they need to simply just exercise and eat well, need to take a moment to ask the patient what they are dealing with. What are there feelings. financial situations etc. Telling someone this stuff without considering their situation is placing a barrier that will stop them from asking for help in the future, as they may feel that they are a nuisance for not being able to afford/do the exercise or healthy food.",
    model,
    tokenizer,
    device,
    target_label=4  # o la etiqueta que quieras analizar
)
'''

def importancia_palabras(attributions, input_ids, tokenizer):
    token_saliency = attributions.abs().sum(dim=2).squeeze()  # [seq_len]
    tokens_ = tokenizer.convert_ids_to_tokens(input_ids.squeeze())

    raw_scores = np.array([s.item() for s in token_saliency])
    min_score, max_score = raw_scores.min(), raw_scores.max()
    range_score = max_score - min_score

    #print(f"[Importancia calculada: min={min_score:.6f}, max={max_score:.6f}, range={range_score:.6f}")

    if range_score < 1e-8:
        # Todos los scores idénticos (o secuencia vacía): asignamos 0 a todos
        norm_scores = np.zeros_like(raw_scores)
    else:
        norm_scores = (raw_scores - min_score) / range_score

    return [
        {"token": tok, "score": float(score)}
        for tok, score in zip(tokens_, norm_scores)
    ]

# Visualización con umbral de activación
def color_word(word, score, threshold=0.2):
    if score > threshold:
        return f"<span style='background-color:rgba(255,0,0,{score:.2f})'>{word}</span>"
    else:
        return word
    
def merge_word_pieces(tokens_with_scores):
    merged = []
    current_word = None
    current_score = []

    for item in tokens_with_scores:
        tok = item["token"]
        score = item["score"]

        if tok in ("[CLS]", "[SEP]", "[PAD]"):
            continue

        if tok.startswith("##") and current_word is not None:
            current_word += tok[2:]
            current_score.append(score)
        else:
            if current_word is not None:
                merged.append({
                    "token": current_word,
                    "score": sum(current_score) / len(current_score)
                })
            current_word = tok
            current_score = [score]

    if current_word is not None:
        merged.append({
            "token": current_word,
            "score": sum(current_score) / len(current_score)
        })

    return merged

"""
MODELO ANTERIOR ---->
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "modelo_multietiqueta")
#model_path = "/backend/ml/modelo_multietiqueta"

# Cargar modelo y tokenizer una sola vez
model = DistilBertForSequenceClassification.from_pretrained(model_path)
tokenizer = DistilBertTokenizerFast.from_pretrained(model_path)

model.eval()

def predict_posts(texts):
    inputs = tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.sigmoid(logits).numpy()
        preds = (probs > 0.5).astype(int)
    return preds.tolist(), probs.tolist()
"""