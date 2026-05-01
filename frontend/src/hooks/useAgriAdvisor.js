import { useContext, useEffect, useRef } from 'react';
import { AgriContext } from '../context/AgriContext';

export const useAgriAdvisor = () => {
  const { 
    farmerProfile, setMessages, agentStatus, setAgentStatus, 
    language, setMandiData, setWeatherData 
  } = useContext(AgriContext);
  
  const wsRef = useRef(null);

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
    const userMsg = { id: Date.now(), role: 'user', content: text, language };
    setMessages(prev => [...prev, userMsg]);
    
    setAgentStatus({}); // Clear for new query

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
      
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'ai', 
        content: data.recommendation,
        content_hindi: data.recommendation_hindi,
        details: data
      };
      setMessages(prev => [...prev, aiMsg]);
      
      if (data.agents_activated.includes('MandiAgent')) {
        fetchMandiData();
      }
      if (data.agents_activated.includes('WeatherAgent')) {
        fetchWeatherData();
      }

    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const fetchMandiData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/mandi/prices?crop=${farmerProfile.crop}&state=${farmerProfile.state}`);
      const data = await res.json();
      setMandiData(data);
    } catch (e) { console.error(e); }
  };

  const fetchWeatherData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/weather?city=${farmerProfile.location}`);
      const data = await res.json();
      setWeatherData(data);
    } catch (e) { console.error(e); }
  };

  const playAudioResponse = async (text) => {
    try {
      const res = await fetch('http://localhost:8000/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) { console.error(e); }
  };

  return {
    sendMessage,
    playAudioResponse,
    fetchMandiData,
    fetchWeatherData
  };
};
