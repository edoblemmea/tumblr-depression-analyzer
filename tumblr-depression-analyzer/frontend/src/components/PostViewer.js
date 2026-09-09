import React, { useState, useEffect } from "react";
import { symptomColors, symptomLabels } from "../utils/processData";
import { colorWord } from "./HighlightText";

// Función para calcular la probabilidad de depresión
const computeProbabilidadDepresion = (labels) => {
  const numSintomas = labels.reduce((acc, val) => acc + val, 0);
  return Math.min(numSintomas / labels.length, 1); // Normalizamos a rango 0..1
};

const PostViewer = ({ post, index, totalPosts, onPrev, onNext, selectedSymptom, setSelectedSymptom }) => {
    const { texto, labels } = post;
    const [tokensWithScores, setTokensWithScores] = useState(null);
    const probabilidad_depresion = computeProbabilidadDepresion(labels);

    useEffect(() => {
    if (selectedSymptom === null) {
      setTokensWithScores(null);
      return;
    }

    async function fetchImportance() {
      const response = await fetch("/api/get-importance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: texto,
          target_label: parseInt(selectedSymptom.replace("sintoma_", "")) - 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("IMPORTANCE DATA:", data); 
        setTokensWithScores(data.tokensWithScores);
      }
    }
    console.log("Selected Symptom:", selectedSymptom);
    fetchImportance();
  }, [selectedSymptom, texto]);

  // Calculamos los síntomas detectados:
  const detectedSymptoms = labels
    .map((val, idx) => (val ? idx : null))
    .filter((idx) => idx !== null)
    .map((idx) => `sintoma_${idx + 1}`);

  return (
    <div className="p-4 bg-white rounded-xl shadow-md max-w-3xl mx-auto my-6">
        {/* Barra superior */}
        <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">
            Post {index + 1} de {totalPosts}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
            <div
                className="h-4 rounded-full"
                style={{
                width: `${(probabilidad_depresion * 100).toFixed(0)}%`,
                backgroundColor: probabilidad_depresion >= 0.5 ? "#ef4444" : "#22c55e",
                }}
          />
        </div>
        <div className="text-center text-sm mt-1">
          {probabilidad_depresion >= 0.5
            ? "Signos de depresión"
            : "Sin signos de depresión"}
          &nbsp;({(probabilidad_depresion * 100).toFixed(1)}%)
        </div>
    </div>

    <div className="text-base leading-relaxed mb-4">
    {tokensWithScores ? (
        tokensWithScores
        .filter(({ token }) => !["[CLS]", "[SEP]", "[PAD]"].includes(token))
        .map(({ token, score }, i) => colorWord(token, score, selectedSymptom, 0.2, i))
    ) : (
        texto.replace(/\[CLS\]|\[SEP\]|\[PAD\]\[UNK\]/g, "")
        .replace(/ ##/g, "")
        .trim()
    )}
    </div>



    {/* Leyenda de síntomas */}
    <div className="flex flex-wrap gap-2 text-sm mb-4">
    {Object.keys(symptomColors).map((key) => {
        const isActive = detectedSymptoms.includes(key);
        return (
        <div
            key={key}
            className={`flex items-center cursor-pointer ${
            selectedSymptom === key ? "font-bold underline" : ""
            }`}
            onClick={() =>
            setSelectedSymptom(selectedSymptom === key ? null : key)
            }
            style={{
            border: isActive ? `2px solid ${symptomColors[key]}` : "none",
            borderRadius: "6px",
            padding: "2px 6px",
            }}
        >
            <span
            className="inline-block w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: symptomColors[key] }}
            ></span>
            {symptomLabels[key]}
        </div>
        );
    })}
    </div>


      {/* Navegación */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={index === totalPosts - 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default PostViewer;
