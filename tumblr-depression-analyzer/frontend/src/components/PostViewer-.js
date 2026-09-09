import React from "react";
import { symptomColors, symptomLabels } from "../utils/processData";

// Función para calcular la probabilidad de depresión
const computeProbabilidadDepresion = (labels) => {
  const numSintomas = labels.reduce((acc, val) => acc + val, 0);
  return Math.min(numSintomas / labels.length, 1); // Normalizamos a rango 0..1
};

const PostViewer = ({ post, index, totalPosts, onPrev, onNext, selectedSymptom, setSelectedSymptom }) => {
  // Desestructuramos el post:
  const { texto, labels } = post;

  // Calculamos la probabilidad de depresión:
  const probabilidad_depresion = computeProbabilidadDepresion(labels);

  // Función para resaltar texto (simplificada):
  const highlightText = (text, labels) => {
    const words = text.split(/\s+/).map((word, i) => {
      // Para cada síntoma activado, intentamos resaltar si la palabra lo contiene
      for (let idx = 0; idx < labels.length; idx++) {
        if (labels[idx]) {
          const labelName = `sintoma_${idx + 1}`;
          const symptomLabelText = symptomLabels[labelName]?.toLowerCase() || "";

          // Si la palabra contiene parte del nombre del síntoma, resaltamos
          if (word.toLowerCase().includes(symptomLabelText)) {
            return (
              <span
                key={i}
                className="highlight"
                style={{
                  backgroundColor: symptomColors[labelName],
                  borderRadius: "4px",
                  padding: "2px 4px",
                  margin: "1px",
                }}
                title={symptomLabels[labelName]}
              >
                {word}
              </span>
            );
          }
        }
      }

      // Si no coincide, devolvemos la palabra normal:
      return word + " ";
    });

    return words;
  };

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
              backgroundColor: probabilidad_depresion > 0.5 ? "#ef4444" : "#22c55e",
            }}
          />
        </div>
        <div className="text-center text-sm mt-1">
          {probabilidad_depresion > 0.5
            ? "Signos de depresión"
            : "Sin signos de depresión"}
          &nbsp;({(probabilidad_depresion * 100).toFixed(1)}%)
        </div>
      </div>

      {/* Texto con resaltado */}
      <div className="text-base leading-relaxed mb-4">
        {highlightText(texto, labels)}
      </div>

      {/* Leyenda de síntomas */}
      <div className="flex flex-wrap gap-2 text-sm mb-4">
        {Object.keys(symptomColors).map((key) => (
          <div
            key={key}
            className={`flex items-center cursor-pointer ${
              selectedSymptom === key ? "font-bold underline" : ""
            }`}
            onClick={() =>
              setSelectedSymptom(selectedSymptom === key ? null : key)
            }
          >
            <span
              className="inline-block w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: symptomColors[key] }}
            ></span>
            {symptomLabels[key]}
          </div>
        ))}
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
