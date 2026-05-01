import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Info, Database } from 'lucide-react';

export default function RecommendationCard({ details }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="bg-white border border-green-mid/20 rounded-2xl p-5 shadow-sm text-text-dark"
    >
      <motion.div variants={itemVariants} className="mb-4">
        <div className="font-heading text-xl text-green-deep mb-2 font-semibold">Recommendation</div>
        <p className="text-md leading-relaxed whitespace-pre-wrap">{details.recommendation_hindi || details.recommendation}</p>
      </motion.div>

      {details.conflicts && (
        <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start">
          <ShieldAlert className="text-conflict-warn mt-0.5 mr-2 flex-shrink-0" size={18} />
          <div className="text-sm text-amber-900">
            <span className="font-bold">Tradeoff Warning:</span> {details.conflict_explanation}
          </div>
        </motion.div>
      )}

      {details.agents_activated && details.agents_activated.length > 0 && (
        <motion.div variants={itemVariants} className="bg-cream rounded-xl p-3 mb-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-green-deep font-semibold">
              <Info size={16} className="mr-1" /> Reasoning Basis
            </div>
            <div className={`px-2 py-0.5 rounded text-xs font-bold ${
              details.confidence_level === 'High' ? 'bg-success/20 text-success' :
              details.confidence_level === 'Medium' ? 'bg-amber-200 text-amber-800' :
              'bg-red-200 text-red-800'
            }`}>
              {details.confidence_level} Confidence
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {details.agents_activated.map(agent => (
              <span key={agent} className="bg-green-mid/10 text-green-deep px-2 py-1 rounded text-xs font-mono">
                {agent}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {details.data_sources && (
        <motion.div variants={itemVariants} className="flex items-center text-xs text-text-muted mt-2 border-t pt-3">
          <Database size={12} className="mr-1" /> Sources: {details.data_sources.join(", ")}
        </motion.div>
      )}
    </motion.div>
  );
}
