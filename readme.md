# Intelligent System for Identifying Youth Mental Health Issues on Social Media

Bachelor's Thesis in Data Engineering and Systems

**Author:** Emma Nájera Ríos

**Supervisor:** María Luisa Martín Ruíz

**Department:** Telematics and Electronics Engineering

## Overview

This project is a web application that analyzes posts from Tumblr to detect possible signs of
depression in text, based on the clinical criteria of the *Diagnostic and Statistical Manual of
Mental Disorders* (DSM-5). Rather than a binary "depressed / not depressed" label, the system
predicts the presence of **ten individual symptoms** of major depressive disorder, offering a
more clinically meaningful and interpretable view of a post's content.

The solution combines:

- A **multi-label transformer-based classifier** (fine-tuned DistilBERT) trained on posts
  collected from Reddit.
- A **web application** where users can search Tumblr posts by tag or upload their own text,
  view aggregated statistics of detected symptoms, and inspect individual posts with
  word-level explanations of each prediction.

The project is not intended to replace a professional diagnosis. It is designed as an
**exploratory support tool** for psychological research, content moderation, and early
intervention strategies, with a strong emphasis on interpretability, privacy, and ethical use
of AI in a sensitive domain.

## Motivation

Widespread social media use among young people has been linked to higher anxiety levels and
disrupted sleep patterns, both of which negatively affect academic performance and mental
wellbeing. Platforms like Tumblr, in particular, have become spaces where teenagers openly
share personal struggles and form support communities around mental health — but they can also
act as "echo chambers" that normalize or even glamorize self-harm and disordered eating.
Roughly 30% of Gen Z has self-diagnosed a mental health condition, most commonly anxiety (48%)
and depression (37%). This project explores whether machine learning can help identify
linguistic patterns associated with depressive symptoms in this kind of user-generated content.

## Key features

- **Symptom-level, multi-label prediction** (not a single depression/no-depression label),
  aligned with the nine DSM-5 diagnostic criteria for major depressive disorder (split into
  ten labels in this project).
- **Semi-automatically built dataset**, since no public dataset with symptom-level depression
  labels exists. Posts were collected from Reddit and labeled per symptom using keyword search
  combined with independent logistic regression classifiers.
- **Interpretability by design**: saliency maps (via Captum) highlight which words in a post
  contributed most to each symptom prediction.
- **Interactive dashboard**: symptom frequency, depression-level distribution, and a
  symptom co-occurrence heatmap.
- **Privacy-conscious**: no usernames, links, or other identifying information are stored;
  only post text is processed.

## Model

### Task definition

A multi-label text classification problem: given a post, predict a binary vector
`ŷ ∈ {0,1}^10`, one entry per symptom, since a single post can exhibit several symptoms at
once.

### Symptoms (labels)

1. Persistent depressed mood
2. Loss of interest or pleasure (anhedonia)
3. Changes in appetite or body weight
4. Sleep disturbances (insomnia or hypersomnia)
5. Psychomotor agitation or retardation
6. Fatigue or loss of energy
7. Excessive guilt or self-criticism
8. Difficulty concentrating or making decisions
9. Self-harm behaviors
10. Suicidal ideation

### Architecture

- Base encoder: `distilbert-base-uncased` (Hugging Face `transformers`).
- `[CLS]` token representation → Linear(768→768) → Tanh → Dropout(0.3) → Linear(768→10) logits.
- Loss: `BCEWithLogitsLoss` (sigmoid + binary cross-entropy per label), appropriate for
  multi-label classification.
- Optimizer: AdamW, with weight decay (0.01) applied to weights only (not to biases or
  LayerNorm parameters).

### Training configuration (final)

| Hyperparameter        | Value  |
|------------------------|--------|
| Max sequence length     | 128    |
| Batch size               | 32     |
| Learning rate            | 3e-5   |
| Dropout                 | 0.3    |
| Weight decay             | 0.01   |
| Epochs (early-stopped at) | 4    |

Model selection used **F1 micro**, **F1 macro**, and **Hamming Loss** on a held-out validation
split, since plain accuracy is misleading for imbalanced multi-label data.

### Datasets

| Dataset | Source | Size | Use |
|---|---|---|---|
| Reddit (symptom-labeled) | `r/depression` + neutral subreddits, semi-automatically labeled | 34,864 posts | Train / validation / test |
| Tumblr (manually labeled) | Collected via the app's Tumblr integration | 324 posts | Real-domain evaluation |
| Depression: Reddit Dataset (Cleaned) [Kaggle] | Public dataset | 7,650 posts | Binary depression-detection evaluation |

## Results (summary)

**On the Reddit test set** (same domain as training):

- F1 micro: **0.879** · F1 macro: **0.879**
- Precision: 0.856 · Recall: 0.905
- Hamming Loss: 0.095 · ROC-AUC: **0.971**
- Exact Match Ratio: 0.654

**On real Tumblr posts** (manually re-labeled, out-of-domain evaluation):

- F1 micro: **0.664** · F1 macro: 0.671
- Hamming Loss: 0.091 · Exact Match Ratio: 0.493

The performance drop on Tumblr is attributed to stylistic differences between platforms
(Reddit posts tend to be explicit and structured; Tumblr posts are more fragmented, emotional,
and rely on slang/euphemisms), a different label distribution, and the smaller, manually
labeled evaluation sample.

**As a binary depression detector** (≥5 symptoms predicted, per DSM-5 criteria), using
continuous symptom probabilities instead of a hard vote improved discrimination
significantly (AUC 0.94 vs. 0.79 for the naive symptom-count threshold).

Per-symptom ROC-AUC on Tumblr was above 0.85 for 8 of the 10 symptoms, with *appetite/weight
changes* (0.98) and *sleep disturbances* (0.97) performing best, and *depressed mood* (0.73)
performing worst — likely due to how subtly/ambiguously it is expressed in informal text.

## Web application

### Architecture

Client-server architecture with three main layers:

- **Backend** (Flask, RESTful API): fetches posts from the Tumblr API, cleans text, runs
  DistilBERT inference, and computes saliency-based word importance.
- **Frontend** (React): search screen, results dashboard (symptom frequency, correlation
  heatmap, depression-level pie chart), and an individual post viewer with highlighted words.
- **External API**: Tumblr API, used to search and retrieve real-time posts by tag.

### Backend structure

```
app.py                       # Flask app entry point, CORS, blueprint registration
routes/fetch_posts.py        # POST /api/fetch-publicaciones — fetch + classify posts
routes/get_importance.py     # POST /api/get-importance — saliency map for a given label
utils/tumblr_api.py          # Tumblr API access helpers
ml/predict.py                # Model loading, inference, and interpretability (Captum)
```

### Frontend structure

```
App.js                       # Entry point
Fetchpublicaciones.js        # Search form, API calls, state management
Dashboard.js                 # Aggregated visualizations
HeatmapCorrelacion.js        # Symptom correlation heatmap
PostViewer.js                # Individual post viewer with highlighted symptoms
utils/HighlightText.js       # Renders per-word symptom highlighting
utils/processData.js         # Symptom labels, descriptions, and color mapping
```

## Ethical and privacy considerations

- No usernames, profile links, or other identifying metadata are stored or displayed — only
  post text is processed, in line with GDPR principles.
- Saliency maps are exposed in the UI so predictions are not a "black box": users can see
  which words drove each symptom prediction.
- The tool is explicitly framed as **decision support for researchers and mental health
  professionals**, not as a diagnostic instrument.

## Known limitations

- Saliency maps often do not clearly differentiate between symptoms: the model tends to
  highlight generic depression-related words (e.g. "depression" itself) across many labels,
  suggesting it partly relies on symptom co-occurrence rather than symptom-specific language.
- Performance degrades on Tumblr's informal, euphemism-heavy style compared to Reddit.
- The model only supports English text.
- The Reddit training labels come from a semi-automatic (keyword + logistic regression)
  pipeline, not from clinical experts, which may introduce label noise.

## Future work

- Continuous data collection and correction loop: let users (ideally mental health
  professionals) correct mislabeled predictions and periodically fine-tune the model on this
  curated Tumblr-specific data (domain adaptation, adversarial training, or partially
  supervised pseudo-labeling).
- Better handling of informal language, abbreviations, and euphemisms common on Tumblr.
- Multilingual support, starting with Spanish.
- Richer interpretability: multi-head attention visualization, SHAP/LIME-based explanations.
- Multi-tag search, image-based data collection, and persistent storage in a database for
  cumulative, cross-search analytics.

## Tech stack

- **Model**: Python, PyTorch, Hugging Face `transformers` (DistilBERT), scikit-learn, Captum
- **Backend**: Flask, BeautifulSoup, Tumblr API (OAuth)
- **Frontend**: React.js
- **Data sources**: Reddit API, Tumblr API, Kaggle ("Depression: Reddit Dataset (Cleaned)")

## Author

**Emma Nájera Ríos**
Bachelor's Thesis in Data Engineering and Systems
Escuela Técnica Superior de Ingeniería y Sistemas de Telecomunicación

Supervised by María Luisa Martín Ruíz (Telematics and Electronics Engineering Department).

## Disclaimer

This project is a research prototype and **does not provide medical or psychological
diagnoses**. If you or someone you know may be struggling with depression or thoughts of
self-harm, please reach out to a mental health professional or a crisis support line in your
country.
