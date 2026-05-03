import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Info, Database } from 'lucide-react';

export default function RecommendationCard({ details }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 }
  };

  // The main text content of the response
  const mainText = details?.recommendation_hindi || details?.recommendation || details?.content || '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="bg-white border border-green-mid/15 rounded-2xl p-5 shadow-sm text-text-dark"
    >
      {/* Main response text — no hardcoded heading */}
      <motion.div variants={itemVariants} className="mb-3">
        <p className="text-base leading-relaxed whitespace-pre-wrap text-text-dark">
          {mainText}
        </p>
      </motion.div>

      {/* Conflict warning */}
      {details?.conflicts && (
        <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start">
          <ShieldAlert className="text-amber-600 mt-0.5 mr-2 flex-shrink-0" size={18} />
          <div className="text-sm text-amber-900">
            <span className="font-bold">Tradeoff Warning:</span> {details.conflict_explanation}
          </div>
        </motion.div>
      )}

      {/* Agents activated + confidence */}
      {details?.agents_activated && details.agents_activated.length > 0 && (
        <motion.div variants={itemVariants} className="bg-cream rounded-xl p-3 mb-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-green-deep font-semibold">
              <Info size={14} className="mr-1" /> Reasoning Basis
            </div>
            {details.confidence_level && (
              <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                details.confidence_level === 'High' ? 'bg-green-100 text-green-800' :
                details.confidence_level === 'Medium' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {details.confidence_level} Confidence
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {details.agents_activated.map(agent => (
              <span key={agent} className="bg-green-mid/10 text-green-deep px-2 py-0.5 rounded text-xs font-mono">
                {agent}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data sources */}
      {details?.data_sources && (
        <motion.div variants={itemVariants} className="flex items-center text-xs text-text-muted border-t pt-3 mt-1">
          <Database size={11} className="mr-1.5" /> Sources: {details.data_sources.join(', ')}
        </motion.div>
      )}
    </motion.div>
  );
}
