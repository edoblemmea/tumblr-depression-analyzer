import { useEffect, useState } from "react";
import { symptomColors } from '../utils/processData';
import { Bar, Pie } from "react-chartjs-2";
import { saveAs } from "file-saver";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import HeatmapCorrelacion from "./HeatmapCorrelacion";
import PostViewer from "./PostViewer";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const sintomaNames = [
  'Estado de ánimo deprimido',
  'Anhedonia',
  'Cambios en apetito/peso',
  'Alteraciones de sueño',
  'Lentitud psicomotora/agitación',
  'Fatiga',
  'Autocrítica',
  'Dificultad para concentrarse',
  'Autolesión',
  'Pensamientos suicidas',
  'Síntomas físicos'
];

export default function Dashboard({ predictions }) {
  console.log("📊 Predictions recibidas en Dashboard:", predictions);
  const [depresionCount, setDepresionCount] = useState({ si: 0, algunos: 0, no: 0 });
  const [sintomaFrequencies, setSintomaFrequencies] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;

    const depCounts = { si: 0, algunos:0, no: 0 };
    const sintomaSum = {};

    predictions.forEach((post) => {
      const labels = post.labels;
      const numSintomas = labels.reduce((acc, val) => acc + val, 0);
      if (numSintomas >= 5) depCounts.si++;
      if (numSintomas >0) depCounts.algunos++;
      else depCounts.no++;

      labels.forEach((val, idx) => {
        const key = sintomaNames[idx] || `Síntoma ${idx + 1}`;
        sintomaSum[key] = (sintomaSum[key] || 0) + val;
      });
    });

    setDepresionCount(depCounts);
    setSintomaFrequencies(sintomaSum);
  }, [predictions]);

  const handleExportCSV = () => {
    const csv = predictions.map((p) => {
      const texto = p.texto.replace(/\n/g, " ");
      const sintomas = p.labels.join(",");
      return `"${texto}",${sintomas}`;
    });
    const header =
      "texto," + predictions[0].labels.map((_, i) => `sintoma_${i + 1}`).join(",");
    const blob = new Blob([header + "\n" + csv.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, "predicciones.csv");
  };

  const pieData = {
    labels: ["Con indicios de depresión (=>5 Síntomas)", "Con algunos síntomas (<5 Síntomas)", "Sin síntomas"],
    datasets: [
      {
        label: "Posts",
        data: [depresionCount.si, depresionCount.algunos, depresionCount.no],
        backgroundColor: ['#fc8d62','#8da0cb','#66c2a5'],
      },
    ],
  };

  const barData = {
    labels: Object.keys(sintomaFrequencies),
    datasets: [
      {
        label: "Frecuencia de síntomas",
        data: Object.values(sintomaFrequencies),
        backgroundColor: "#01beb3"//Object.keys(sintomaFrequencies).map((_, idx) => {
          //return symptomColors[`sintoma_${idx + 1}`] || "#cccccc";
        //}),
      },
    ],
  };


  if (selectedPost !== null) {
    return (
      <PostViewer
        post={predictions[selectedPost]}
        index={selectedPost}
        totalPosts={predictions.length}
        onPrev={() =>
          setSelectedPost(selectedPost > 0 ? selectedPost - 1 : selectedPost)
        }
        onNext={() =>
          setSelectedPost(
            selectedPost < predictions.length - 1 ? selectedPost + 1 : selectedPost
          )
        }
        selectedSymptom={selectedSymptom}
        setSelectedSymptom={setSelectedSymptom}
        setSelectedPost={setSelectedPost}
      />
    );
  }

return (
  <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
    {/* Título */}
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
      Análisis de Predicciones
    </h2>

    {/* Sección superior: Pie y Barra */}
    <div className="grid md:grid-cols-2 gap-8">
      <div className="rounded bg-white p-6 shadow-md flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4">Distribución de depresión</h3>
        <div className="w-full max-w-xs">
          <Pie data={pieData} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Frecuencia de síntomas</h3>
        <Bar data={barData} />
      </div>
    </div>

    {/* Sección inferior: Heatmap y Posts */}
    <div className="grid md:grid-cols-2 gap-8">
      <div className="rounded-xl bg-white p-6 shadow-md flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Correlación entre síntomas</h3>
        <HeatmapCorrelacion predictions={predictions} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Listado de Posts</h3>
        <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
          {predictions.map((post, index) => (
            <div
              key={index}
              className="border p-3 rounded hover:bg-gray-50 flex justify-between items-center"
            >
              <div className="text-sm text-gray-700 truncate w-3/4">
                {post.texto.slice(0, 100)}...
              </div>
              <button
                onClick={() => setSelectedPost(index)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Botón exportar */}
    <div className="text-right">
      <button
        onClick={handleExportCSV}
        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Descargar CSV
      </button>
    </div>
  </div>
);

}
