import React, { useEffect, useState } from "react";
import { HeatMapGrid } from "react-grid-heatmap";

const HeatmapCorrelacion = ({ predictions }) => {
  const [correlationMatrix, setCorrelationMatrix] = useState([]);

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
        corrMatrix[i][j] = denominator === 0 ? 0 : numerator / denominator;
      }
    }

    setCorrelationMatrix(corrMatrix);
  }, [predictions]);

  if (correlationMatrix.length === 0) return null;

  const xLabels = correlationMatrix.map((_, i) => `S${i + 1}`);
  const yLabels = xLabels;

  return (
    <div className="mt-6">
      <div style={{ fontSize: "12px" }}>
        <HeatMapGrid
          data={correlationMatrix}
          xLabels={xLabels}
          yLabels={yLabels}
          //cellRender={(x) => x.toFixed(2)}
          cellRender={() => null}
          cellStyle={(_x, _y, value) => ({
            background: `rgb(255, ${255 - value * 255}, ${255 - value * 255})`,
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
    </div>
  );
};

export default HeatmapCorrelacion;
