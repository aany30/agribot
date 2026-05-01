import React, { useState } from 'react';
import { useAgriAdvisor } from '../hooks/useAgriAdvisor';
import { AgriContext } from '../context/AgriContext';
import { Mic, Send, Volume2 } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import { motion } from 'framer-motion';

const SUGGESTIONS = [
  "आज इंदौर मंडी में गेहूं का भाव क्या है?",
  "Mere tomato ke patte pe kale daag aa rahe hain",
  "Is season mein Vidarbha mein kya ugana chahiye?",
  "PM-KISAN ke liye eligible hoon kya? 2 acre hai",
  "What yield can I expect from 3 acre wheat in Bhopal?"
];

export default function ChatPanel() {
  const { messages } = React.useContext(AgriContext);
  const { sendMessage, playAudioResponse } = useAgriAdvisor();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen bg-cream relative z-10 shadow-2xl overflow-hidden">
      <div className="h-16 border-b border-green-mid/10 flex items-center px-6 bg-white/70 backdrop-blur-md z-20">
        <h1 className="font-heading text-2xl font-bold text-green-deep tracking-tight">AgriAdvisor</h1>
        <span className="ml-3 px-2 py-0.5 bg-gold/20 text-gold text-xs font-bold rounded">AI Agent System</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-deep text-gold rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transform rotate-3">
              🌾
            </div>
            <h2 className="font-heading text-3xl font-bold text-green-deep mb-3">Welcome to AgriAdvisor</h2>
            <p className="text-text-muted mb-8 text-lg">Your multi-specialist AI farm decision system. Ask me anything about your farm.</p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => sendMessage(s)}
                  className="bg-white border border-green-mid/20 hover:border-gold px-4 py-2.5 rounded-full text-sm font-medium text-green-deep transition-all shadow-sm hover:shadow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-gold text-green-deep px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[80%] font-medium text-lg">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-deep text-gold flex items-center justify-center shadow-md flex-shrink-0 mt-1 text-xl">
                    🌾
                  </div>
                  <div className="flex-1">
                    <RecommendationCard details={msg.details || { recommendation: msg.content }} />
                    {msg.details && (
                      <button 
                        onClick={() => playAudioResponse(msg.content)}
                        className="mt-2 text-text-muted hover:text-green-deep flex items-center text-sm font-medium transition"
                      >
                        <Volume2 size={16} className="mr-1" /> Listen to Audio
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-green-mid/10 z-20 relative">
        <div className="max-w-4xl mx-auto flex items-center bg-cream-dark rounded-full p-1.5 border border-transparent focus-within:border-gold focus-within:bg-white transition-all shadow-inner">
          <button className="p-3 text-text-muted hover:text-green-deep rounded-full transition">
            <Mic size={22} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about crops, weather, mandi prices, or schemes..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-text-dark text-lg font-medium placeholder:text-text-muted/60"
          />
          <button 
            onClick={handleSend}
            className="p-3 bg-green-deep text-gold rounded-full hover:bg-green-mid transition shadow-md m-1"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
