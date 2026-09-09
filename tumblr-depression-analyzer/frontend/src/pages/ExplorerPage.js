import React, { useState } from "react";
import PostViewer from "../components/PostViewer";
import mockData from "../data/predicciones_mock.json"; // o los datos reales

const ExplorerPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSymptom, setSelectedSymptom] = useState(null);

  const filteredPosts = selectedSymptom
    ? mockData.filter(post => post.predicciones[selectedSymptom])
    : mockData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {filteredPosts.length > 0 ? (
        <PostViewer
          post={filteredPosts[currentIndex]}
          index={currentIndex}
          totalPosts={filteredPosts.length}
          onPrev={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          onNext={() => setCurrentIndex(i => Math.min(i + 1, filteredPosts.length - 1))}
          selectedSymptom={selectedSymptom}
          setSelectedSymptom={setSelectedSymptom}
        />
      ) : (
        <p className="text-center text-gray-500">No hay posts para mostrar.</p>
      )}
    </div>
  );
};

export default ExplorerPage;
