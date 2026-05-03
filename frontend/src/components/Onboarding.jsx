import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, User, MapPin } from 'lucide-react';

const STEPS = [
  {
    id: 'name',
    icon: <User size={30} />,
    question: 'What is your name?',
    subtext: 'We\'ll personalise your AgriAdvisor experience.',
    placeholder: 'e.g. Ramesh Kumar',
    field: 'name',
  },
  {
    id: 'state',
    icon: <MapPin size={30} />,
    question: 'Which state do you farm in?',
    subtext: 'We\'ll fetch live weather and mandi prices for your region.',
    placeholder: 'e.g. Maharashtra, Punjab, MP, UP',
    field: 'state',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputVal, setInputVal] = useState('');

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    const value = inputVal.trim();
    if (!value) return;

    const updated = { ...answers, [current.field]: value };
    setAnswers(updated);
    setInputVal('');

    if (isLast) {
      const profile = {
        ...updated,
        location: updated.state,   // default location = state for weather
        crop: 'General',
        land_acres: 0,
        language: 'en',
        farmer_id: `farmer_${Date.now()}`,
        category: 'general',
      };
      localStorage.setItem('farmer_profile', JSON.stringify(profile));
      localStorage.setItem('onboarding_done', 'true');
      onComplete(profile);
    } else {
      setStep(s => s + 1);
    }
  };

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      {/* Soft background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-green-deep/5" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gold/8" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-14 h-14 bg-green-deep rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            🌾
          </div>
          <div>
            <div className="font-heading text-3xl font-bold text-green-deep">AgriAdvisor</div>
            <div className="text-text-muted text-sm">AI Farm Decision System</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gold w-10' : 'bg-cream-dark w-6'}`} />
          ))}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.22 }}
            className="bg-white rounded-3xl p-8 shadow-2xl border border-green-mid/10"
          >
            <div className="w-14 h-14 bg-green-deep/10 text-green-deep rounded-2xl flex items-center justify-center mb-5">
              {current.icon}
            </div>

            <h2 className="font-heading text-2xl font-bold text-green-deep mb-1">
              {current.question}
            </h2>
            <p className="text-text-muted text-sm mb-6">{current.subtext}</p>

            <div className="flex gap-3 items-center">
              <input
                autoFocus
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder={current.placeholder}
                className="flex-1 bg-cream-dark rounded-2xl px-5 py-4 text-lg font-medium text-text-dark placeholder:text-text-muted/50 border-2 border-transparent focus:border-gold outline-none transition-all"
              />
              <button
                onClick={handleNext}
                disabled={!inputVal.trim()}
                className="w-14 h-14 bg-green-deep text-gold rounded-2xl flex items-center justify-center hover:bg-green-mid transition disabled:opacity-30 flex-shrink-0 shadow-md"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Collected so far */}
        {Object.keys(answers).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {Object.entries(answers).map(([k, v]) => (
              <span key={k} className="bg-green-deep/10 text-green-deep text-xs px-3 py-1.5 rounded-full font-medium capitalize">
                {k}: <span className="font-bold">{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
