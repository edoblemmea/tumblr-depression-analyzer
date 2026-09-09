import React from "react";
import { symptomColors, symptomLabels } from "../utils/processData";

const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

export const colorWord = (word, score, symptomKey, threshold = 0.2) => {
  if (score > threshold && symptomKey && symptomColors[symptomKey]) {
    const [r, g, b] = hexToRgb(symptomColors[symptomKey]);
    return (
      <span
        key={word + score}
        style={{ backgroundColor: `rgba(${r},${g},${b},${score.toFixed(2)})`, padding: "1px 2px" }}
        title={`Score: ${score.toFixed(3)}`}
      >
        {word}{" "}
      </span>
    );
  }
  return word + " ";
};

const HighlightedText = ({ tokensWithScores, symptomKey, threshold = 0.2 }) => {
  return (
    <div>
      {tokensWithScores.map(({ token, score }, i) => (
        <React.Fragment key={`${token}-${i}`}>
          {colorWord(token, score, symptomKey, threshold)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default HighlightedText;
