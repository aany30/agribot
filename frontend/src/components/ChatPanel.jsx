import React, { useState, useRef, useEffect } from 'react';
import { useAgriAdvisor } from '../hooks/useAgriAdvisor';
import { AgriContext } from '../context/AgriContext';
import { Mic, Send, Volume2, Square } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel() {
  const { messages, farmerProfile } = React.useContext(AgriContext);
  const { sendMessage, playAudioResponse, isAudioPlaying, stopAudio } = useAgriAdvisor();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleMic = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        // Send to backend for transcription
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        try {
          const res = await fetch('http://localhost:8000/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            sendMessage(data.text);
          }
        } catch (e) {
          console.error('Transcription error:', e);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Mic error:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen bg-cream relative z-10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-green-mid/10 flex items-center px-6 bg-white/70 backdrop-blur-md z-20">
        <h1 className="font-heading text-2xl font-bold text-green-deep tracking-tight">AgriAdvisor</h1>
        <span className="ml-3 px-2 py-0.5 bg-gold/20 text-gold text-xs font-bold rounded">AI Agent System</span>
        {farmerProfile && (
          <span className="ml-auto text-sm text-text-muted font-medium">
            👤 {farmerProfile.name} · {farmerProfile.crop} · {farmerProfile.location}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-green-deep text-gold rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-lg">
              🌾
            </div>
            <h2 className="font-heading text-3xl font-bold text-green-deep mb-3">
              Namaste, {farmerProfile?.name?.split(' ')[0] || 'Farmer'}!
            </h2>
            <p className="text-text-muted text-lg leading-relaxed">
              Ask me anything about your <strong className="text-green-deep">{farmerProfile?.crop}</strong> crop —
              weather, mandi prices, pests, soil health, government schemes, or yield predictions.
            </p>
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
              ) : msg.loading ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-deep text-gold flex items-center justify-center shadow-md flex-shrink-0 mt-1 text-xl">
                    🌾
                  </div>
                  <div className="bg-white border border-green-mid/15 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5 items-center h-5">
                      {[0,1,2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-green-mid"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-deep text-gold flex items-center justify-center shadow-md flex-shrink-0 mt-1 text-xl">
                    🌾
                  </div>
                  <div className="flex-1">
                    <RecommendationCard details={msg.details || { recommendation: msg.content }} />
                    <button
                      onClick={() => isAudioPlaying ? stopAudio() : playAudioResponse(msg.content)}
                      className="mt-2 text-text-muted hover:text-green-deep flex items-center text-sm font-medium transition gap-1"
                    >
                      {isAudioPlaying
                        ? <><Square size={14} className="fill-current" /> Stop Audio</>
                        : <><Volume2 size={16} /> Listen to Audio</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-green-mid/10 z-20 relative">
        <div className="max-w-4xl mx-auto flex items-center bg-cream-dark rounded-full p-1.5 border border-transparent focus-within:border-gold focus-within:bg-white transition-all shadow-inner">
          <button
            onClick={handleMic}
            className={`p-3 rounded-full transition ${isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-text-muted hover:text-green-deep'}`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            <Mic size={22} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about crops, weather, mandi prices, schemes..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-text-dark text-lg font-medium placeholder:text-text-muted/60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-green-deep text-gold rounded-full hover:bg-green-mid transition shadow-md m-1 disabled:opacity-40"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </div>
        {isRecording && (
          <div className="text-center text-xs text-red-500 font-medium mt-2 animate-pulse">
            🔴 Recording... tap mic again to send
          </div>
        )}
      </div>
    </div>
  );
}
