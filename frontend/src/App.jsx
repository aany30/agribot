import React, { useContext } from 'react';
import { AgriProvider, AgriContext } from './context/AgriContext';
import Onboarding from './components/Onboarding';
import FarmerProfile from './components/FarmerProfile';
import AgentGraph from './components/AgentGraph';
import ChatPanel from './components/ChatPanel';
import MandiChart from './components/MandiChart';
import WeatherWidget from './components/WeatherWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

function AppContent() {
  const { onboardingDone, completeOnboarding, rightPanelOpen, mandiData, weatherData, farmerProfile, setMandiData, setWeatherData } = useContext(AgriContext);

  useEffect(() => {
    if (onboardingDone && farmerProfile) {
      if (!weatherData) {
        fetch(`http://localhost:8000/api/weather?city=${farmerProfile.location}`)
          .then(r => r.json())
          .then(setWeatherData)
          .catch(console.error);
      }
      if (!mandiData) {
        fetch(`http://localhost:8000/api/mandi/prices?crop=${farmerProfile.crop}&state=${farmerProfile.state}`)
          .then(r => r.json())
          .then(setMandiData)
          .catch(console.error);
      }
    }
  }, [onboardingDone, farmerProfile]);

  if (!onboardingDone) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="flex h-screen bg-cream font-body overflow-hidden">
      {/* Left Sidebar */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[300px] h-full flex flex-col p-6 border-r border-green-mid/10 z-20 bg-cream-dark/80 backdrop-blur-sm overflow-y-auto scrollbar-hide shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
      >
        <FarmerProfile />
        <AgentGraph />
      </motion.div>

      {/* Main Chat Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 h-full z-10"
      >
        <ChatPanel />
      </motion.div>

      {/* Right Panel */}
      <AnimatePresence>
        {rightPanelOpen && (mandiData || weatherData) && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-[340px] h-full bg-cream-dark/40 p-6 border-l border-green-mid/10 z-20 overflow-y-auto overflow-x-hidden backdrop-blur-sm shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="font-heading text-xl font-bold text-green-deep mb-6 pb-3 border-b border-green-mid/20">Farm Intelligence</div>
            <MandiChart />
            <WeatherWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AgriProvider>
      <AppContent />
    </AgriProvider>
  );
}

export default App;
