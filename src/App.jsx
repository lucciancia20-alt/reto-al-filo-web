import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CircuitSection from './components/CircuitSection';
import GallerySection from './components/GallerySection';
import InfoFaqSection from './components/InfoFaqSection';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';

export default function App() {
  const [activeDistance, setActiveDistance] = useState('21K');
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (distanceOverride) => {
    if (distanceOverride === '21K' || distanceOverride === '10K') {
      setActiveDistance(distanceOverride);
    }
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar onOpenModal={() => handleOpenModal(activeDistance)} />

      <main className="flex-1">
        <HeroSection onOpenModal={() => handleOpenModal(activeDistance)} />

        <CircuitSection
          activeDistance={activeDistance}
          onSelectDistance={setActiveDistance}
          onOpenModalWithDistance={(dist) => handleOpenModal(dist)}
        />

        <GallerySection />

        <InfoFaqSection />
      </main>

      <Footer onOpenModal={() => handleOpenModal(activeDistance)} />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDistance={activeDistance}
      />
    </div>
  );
}
