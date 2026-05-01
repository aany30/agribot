import React, { useContext, useState } from 'react';
import { AgriContext } from '../context/AgriContext';
import { User, MapPin, Sprout, Layers, Languages, Edit2 } from 'lucide-react';

export default function FarmerProfile() {
  const { farmerProfile, setFarmerProfile, language, setLanguage } = useContext(AgriContext);
  const [isEditing, setIsEditing] = useState(false);

  const toggleLanguage = () => {
    const newLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(newLang);
    setFarmerProfile({ ...farmerProfile, language: newLang });
  };

  return (
    <div className="bg-green-mid rounded-2xl p-6 text-cream shadow-xl mb-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-heading text-2xl font-semibold text-gold">Profile</h2>
        <button onClick={() => setIsEditing(!isEditing)} className="text-cream hover:text-gold transition">
          <Edit2 size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-deep rounded-full flex items-center justify-center border-2 border-gold text-xl shadow-inner">
            <User className="text-gold" />
          </div>
          <div>
            <div className="text-lg font-bold font-heading tracking-wide">{farmerProfile.name}</div>
            <div className="text-sm text-gold-light flex items-center"><MapPin size={14} className="mr-1"/> {farmerProfile.location}, {farmerProfile.state}</div>
          </div>
        </div>

        <div className="bg-green-deep rounded-xl p-3 grid grid-cols-2 gap-2 text-sm shadow-inner">
          <div className="flex items-center space-x-2">
            <Sprout size={16} className="text-success" />
            <span>{farmerProfile.crop}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Layers size={16} className="text-gold" />
            <span>{farmerProfile.land_acres} Acres</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-green-deep p-3 rounded-xl shadow-inner">
          <div className="flex items-center space-x-2">
            <Languages size={18} className="text-gold" />
            <span className="text-sm font-medium">Language</span>
          </div>
          <div className="flex bg-green-mid rounded-full p-1 cursor-pointer" onClick={toggleLanguage}>
            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-gold text-green-deep' : 'text-cream'}`}>EN</div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'hi' ? 'bg-gold text-green-deep' : 'text-cream'}`}>HI</div>
          </div>
        </div>
      </div>
    </div>
  );
}
