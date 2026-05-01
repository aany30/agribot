import { createContext, useState, useEffect } from 'react';

export const AgriContext = createContext();

export const AgriProvider = ({ children }) => {
  const [farmerProfile, setFarmerProfile] = useState(() => {
    const saved = localStorage.getItem('farmer_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Ramesh Kumar', location: 'Indore', state: 'MP',
      crop: 'Wheat', land_acres: 4.5, language: 'hi', category: 'general'
    };
  });
  
  const [messages, setMessages] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [language, setLanguage] = useState(farmerProfile.language || 'hi');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mandiData, setMandiData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    localStorage.setItem('farmer_profile', JSON.stringify(farmerProfile));
  }, [farmerProfile]);

  return (
    <AgriContext.Provider value={{
      farmerProfile, setFarmerProfile,
      messages, setMessages,
      agentStatus, setAgentStatus,
      language, setLanguage,
      rightPanelOpen, setRightPanelOpen,
      mandiData, setMandiData,
      weatherData, setWeatherData
    }}>
      {children}
    </AgriContext.Provider>
  );
};
