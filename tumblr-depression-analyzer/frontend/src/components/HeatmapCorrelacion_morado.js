import React, { useEffect, useState } from "react";
import { HeatMapGrid } from "react-grid-heatmap";

const HeatmapCorrelacion = ({ predictions }) => {
  const [correlationMatrix, setCorrelationMatrix] = useState([]);

  const colorScale = [
    "#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda",
    "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"
  ];

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;

    const labelsArray = predictions.map((p) => p.labels);
    const numSintomas = labelsArray[0].length;
    const corrMatrix = Array.from({ length: numSintomas }, () => Array(numSintomas).fill(0));

    const means = Array(numSintomas).fill(0);
    labelsArray.forEach((labelSet) => {
      labelSet.forEach((val, i) => {
        means[i] += val;
      });
    });
    means.forEach((sum, i) => (means[i] = sum / labelsArray.length));

    for (let i = 0; i < numSintomas; i++) {
      for (let j = 0; j < numSintomas; j++) {
        let numerator = 0;
        let denomA = 0;
        let denomB = 0;
        labelsArray.forEach((labelSet) => {
          const a = labelSet[i] - means[i];
          const b = labelSet[j] - means[j];
          numerator += a * b;
          denomA += a * a;
          denomB += b * b;
        });
        const denominator = Math.sqrt(denomA * denomB);
        const corr = denominator === 0 ? 0 : numerator / denominator;
        corrMatrix[i][j] = Math.max(0, corr); // Asegura valores en [0,1]
      }
    }

    setCorrelationMatrix(corrMatrix);
  }, [predictions]);

  if (correlationMatrix.length === 0) return null;

  const xLabels = correlationMatrix.map((_, i) => `S${i + 1}`);
  const yLabels = xLabels;

  const getColorFromValue = (val) => {
    const idx = Math.min(
      colorScale.length - 1,
      Math.floor(val * colorScale.length)
    );
    return colorScale[idx];
  };

  return (
    <div className="mt-6">
      <div style={{ fontSize: "12px" }}>
        <HeatMapGrid
          data={correlationMatrix}
          xLabels={xLabels}
          yLabels={yLabels}
          cellRender={(x) => x.toFixed(2)}
          cellStyle={(_x, _y, value) => ({
            background: getColorFromValue(value),
            color: value > 0.5 ? "white" : "black",
          })}
          cellHeight="2rem"
          xLabelsStyle={() => ({
            fontSize: "12px",
            transform: "rotate(-45deg)",
            textAlign: "left"
          })}
        />
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center space-x-1 text-sm">
          <span>0</span>
          {colorScale.map((color, i) => (
            <div
              key={i}
              style={{
                backgroundColor: color,
                width: 20,
                height: 20,
                borderRadius: 2,
                border: "1px solid #ccc",
              }}
              title={`Corr: ${(i / (colorScale.length - 1)).toFixed(2)}`}
            />
          ))}
          <span>1</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">Correlación</div>
      </div>
    </div>
  );
};

export default HeatmapCorrelacion;
