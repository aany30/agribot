import { createContext, useState, useEffect } from 'react';

export const AgriContext = createContext();

export const AgriProvider = ({ children }) => {
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('onboarding_done') === 'true'
  );

  const [farmerProfile, setFarmerProfile] = useState(() => {
    const saved = localStorage.getItem('farmer_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('farmer_profile');
    return saved ? (JSON.parse(saved).language || 'en') : 'en';
  });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mandiData, setMandiData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (farmerProfile) {
      localStorage.setItem('farmer_profile', JSON.stringify(farmerProfile));
      setLanguage(farmerProfile.language || 'en');
    }
  }, [farmerProfile]);

  const completeOnboarding = (profile) => {
    setFarmerProfile(profile);
    setOnboardingDone(true);
  };

  return (
    <AgriContext.Provider value={{
      onboardingDone, completeOnboarding,
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
