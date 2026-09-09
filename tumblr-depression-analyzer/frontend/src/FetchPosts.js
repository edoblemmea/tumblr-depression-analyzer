import React, { useState } from 'react';
import './FetchPosts.css';
import Dashboard from './components/Dashboard';

function FetchPosts() {
  const [inputValue, setInputValue] = useState('');
  const [nrPosts, setNrPosts] = useState(20);
  const [sourceType, setSourceType] = useState('tag');
  const [isSearching, setIsSearching] = useState(false); // Si ya hemos buscado
  const [isProcessing, setIsProcessing] = useState(false); // Si estamos procesando
  const [progress, setProgress] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');


  const estimateFetchTime = (n) => 0.03 * n;  // segundos
  const estimatePredictTime = (n) => 0.11 * n; // segundos

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSearching(true);
  setIsProcessing(true);
  setProgress(0);
  setPredictions([]);

      const fetchTime   = estimateFetchTime(nrPosts);
    const predictTime = estimatePredictTime(nrPosts);

    // 1) Arranca la animación
    let startTime   = null;
    let lastUpdate  = 0;
    const animateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // segundos

      let newProg;
      if (elapsed < fetchTime) {
        newProg = Math.round((elapsed / fetchTime) * 40);
        setStatusMessage(`Recolectando ${nrPosts} posts del hashtag "${inputValue}"`);
      } else if (elapsed < fetchTime + predictTime) {
        newProg = Math.round(40 + ((elapsed - fetchTime) / predictTime) * 60);
        setStatusMessage(`Analizando posts...`);
      } else {
        newProg = 100;
        setStatusMessage(`Analizando posts... Análisis completado!`);
      }

      // rate-limit a ~10fps: cada 100ms
      if (timestamp - lastUpdate > 100) {
        setProgress(newProg);
        lastUpdate = timestamp;
      }

      if (newProg < 100) {
        requestAnimationFrame(animateProgress);
      }
    };
    requestAnimationFrame(animateProgress);

    // 2) Espera un tick para que pinte al 0%
    await new Promise((r) => setTimeout(r, 0));

  try {
    const res = await fetch('/api/fetch-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceType, inputValue, nrPosts }),
    });

    const data = await res.json();
    console.log('Respuesta de API:', data);

    const formattedPredictions = data.map((item) => ({
      texto: item.texto,
      labels: item.labels,
      probs: item.probs,
      tokensWithScores: item.tokensWithScores,
    }));

    // Ahora actualizamos el estado con los resultados y paramos el procesamiento
    setPredictions(formattedPredictions);
    setIsProcessing(false);

  } catch (err) {
    console.error('Error al buscar posts:', err);
    setIsProcessing(false);
  }
};


  const handleBackToSearch = () => {
    setIsSearching(false);
    setIsProcessing(false);
    setPredictions([]);
    setProgress(0);
    setInputValue('');
    setNrPosts(20);
  };

  //console.log('Predictions:', predictions);
  return (
    <div className="wrapper">
      {!isSearching ? (
        // Pantalla inicial
        <div className="card">
          <h1 className="title">Tumblr Post Finder</h1>
          <p className="subtitle">Busca contenido relevante por hashtag o comunidad</p>

          <form onSubmit={handleSubmit} className="form">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                placeholder="Escribe una etiqueta o comunidad"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ flex: 3 }}
              />
              <input
                type="number"
                className="input"
                placeholder="Número de posts"
                min="1"
                max="1000"
                value={nrPosts}
                onChange={(e) => setNrPosts(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>

            <div className="options">
              <button
                type="button"
                className={sourceType === 'tag' ? 'option active' : 'option'}
                onClick={() => setSourceType('tag')}
              >
                Hashtag
              </button>
              <button
                type="button"
                className={sourceType === 'community' ? 'option active' : 'option'}
                onClick={() => setSourceType('community')}
              >
                Comunidad
              </button>
            </div>

            <button type="submit" className="submit-btn">Buscar</button>
          </form>

          <div className="divider">o</div>

          <button className="upload-btn">Subir mi documento</button>
        </div>
      ) : isProcessing ? (
        // Pantalla de progreso
        <div className="results-screen">
          <div className="floating-form">
            <form onSubmit={handleSubmit} className="search-bar">
              <input
                type="text"
                className="input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ flex: 3 }}
              />
              <input
                type="number"
                className="input"
                min="1"
                max="100"
                value={nrPosts}
                onChange={(e) => setNrPosts(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <button type="submit" className="submit-btn">Buscar</button>
            </form>
          </div>
              {/* Mensaje de estado */}
          {statusMessage && (
            <div
              style={{
                marginBottom: '1rem',
                fontWeight: '500',
                fontSize: '1.1rem',
                color: '#333',
                textAlign: 'center',
              }}
            >
              {statusMessage}
            </div>
          )}
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress < 100 ? 'Procesando...' : 'Completado'} ({progress}%)</span>
          </div>
        </div>
      ) : (
        // Dashboard + botón "Volver a buscar"
        <>
          <Dashboard predictions={predictions} />
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="submit-btn" onClick={handleBackToSearch}>
              Volver a buscar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FetchPosts;
