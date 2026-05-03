import { useContext, useEffect, useRef, useState } from 'react';
import { AgriContext } from '../context/AgriContext';

export const useAgriAdvisor = () => {
  const {
    farmerProfile, setMessages, setAgentStatus,
    language, setMandiData, setWeatherData
  } = useContext(AgriContext);

  const wsRef = useRef(null);
  const audioRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/agent-status');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAgentStatus(prev => ({
        ...prev,
        [data.agent]: { status: data.status, confidence: data.confidence }
      }));
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [setAgentStatus]);

  const sendMessage = async (text) => {
    if (!farmerProfile) return;
    const userMsg = { id: Date.now(), role: 'user', content: text, language };
    setMessages(prev => [...prev, userMsg]);
    setAgentStatus({});

    // Add a loading placeholder
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadingId, role: 'ai', content: '...', loading: true }]);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          farmer_profile: farmerProfile,
          conversation_history: []
        })
      });

      const data = await res.json();

      // Replace loading placeholder with real response
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              id: loadingId,
              role: 'ai',
              content: data.recommendation,
              content_hindi: data.recommendation_hindi,
              details: data
            }
          : m
      ));

      if (data.agents_activated?.includes('MandiAgent')) {
        fetchMandiData();
      }
      if (data.agents_activated?.includes('WeatherAgent')) {
        fetchWeatherData();
      }

    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { id: loadingId, role: 'ai', content: 'Sorry, I could not reach the server. Please try again.', details: null }
          : m
      ));
      console.error('Chat error:', error);
    }
  };

  const fetchMandiData = async () => {
    if (!farmerProfile) return;
    try {
      const res = await fetch(`http://localhost:8000/api/mandi/prices?crop=${farmerProfile.crop}&state=${farmerProfile.state}`);
      const data = await res.json();
      setMandiData(data);
    } catch (e) { console.error(e); }
  };

  const fetchWeatherData = async () => {
    if (!farmerProfile) return;
    try {
      const res = await fetch(`http://localhost:8000/api/weather?city=${farmerProfile.location}`);
      const data = await res.json();
      setWeatherData(data);
    } catch (e) { console.error(e); }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
  };

  const playAudioResponse = async (text) => {
    if (!text || text === '...') return;

    // Stop any currently playing audio
    stopAudio();

    try {
      const res = await fetch('http://localhost:8000/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000), language: language || 'en' })
      });

      if (!res.ok) throw new Error('Synthesis failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => {
        setIsAudioPlaying(false);
        window.URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsAudioPlaying(false);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (e) {
      setIsAudioPlaying(false);
      console.error('Audio error:', e);
    }
  };

  return {
    sendMessage,
    playAudioResponse,
    stopAudio,
    isAudioPlaying,
    fetchMandiData,
    fetchWeatherData
  };
};
