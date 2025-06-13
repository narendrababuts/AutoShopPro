
import React from 'react';

interface RecommendationsSectionProps {
  customRecommendations?: string[];
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ 
  customRecommendations 
}) => {
  const defaultRecommendations = [
    'Regular servicing is recommended every 5000 km.',
    'Please check oil levels and tire pressure regularly.'
  ];
  
  const recommendations = customRecommendations?.length ? customRecommendations : defaultRecommendations;
  
  return (
    <div className="border p-3 text-xs page-break-avoid">
      <p className="font-medium mb-1">Recommendations:</p>
      {recommendations.map((recommendation, index) => (
        <p key={index}>• {recommendation}</p>
      ))}
    </div>
  );
};

export default RecommendationsSection;
