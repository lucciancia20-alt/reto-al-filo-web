import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CircuitSection from './components/CircuitSection';
import GallerySection from './components/GallerySection';
import InfoFaqSection from './components/InfoFaqSection';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';
import AdminModal from './components/AdminModal';
import {
  getLocalCachedRaceConfig,
  fetchLiveRaceConfig,
  saveLiveRaceConfig,
  resetLiveRaceConfig,
} from './firebase/config';

function isAdminUrl() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash === '#admin' ||
    window.location.pathname.replace(/\/+$/, '') === '/admin'
  );
}

export default function App() {
  const [raceConfig, setRaceConfig] = useState(() => getLocalCachedRaceConfig());
  const [activeDistance, setActiveDistance] = useState('21K');
  const [modalOpen, setModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(() => isAdminUrl());

  useEffect(() => {
    const onHashChange = () => {
      if (isAdminUrl()) {
        setAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    // Carga diferida de la configuración remota desde Firestore para no bloquear el primer render
    const timer = setTimeout(async () => {
      const result = await fetchLiveRaceConfig();
      if (result?.config) {
        setRaceConfig(result.config);
      }
    }, 600);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      clearTimeout(timer);
    };
  }, []);

  const handleOpenModal = (distanceOverride) => {
    if (distanceOverride === '21K' || distanceOverride === '10K') {
      setActiveDistance(distanceOverride);
    }
    setModalOpen(true);
  };

  const handleSaveConfig = async (nextConfig) => {
    const res = await saveLiveRaceConfig(nextConfig);
    if (res?.config) {
      setRaceConfig(res.config);
    }
    return res;
  };

  const handleResetConfig = async () => {
    const res = await resetLiveRaceConfig();
    if (res?.config) {
      setRaceConfig(res.config);
    }
    return res;
  };

  const handleCloseAdmin = () => {
    setAdminOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar onOpenModal={() => handleOpenModal(activeDistance)} />

      <main className="flex-1">
        <HeroSection
          raceConfig={raceConfig}
          onOpenModal={() => handleOpenModal(activeDistance)}
        />

        <CircuitSection
          raceConfig={raceConfig}
          activeDistance={activeDistance}
          onSelectDistance={setActiveDistance}
          onOpenModalWithDistance={(dist) => handleOpenModal(dist)}
        />

        <GallerySection />

        <InfoFaqSection raceConfig={raceConfig} />
      </main>

      <Footer
        raceConfig={raceConfig}
        onOpenModal={() => handleOpenModal(activeDistance)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <RegistrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDistance={activeDistance}
        raceConfig={raceConfig}
      />

      <AdminModal
        isOpen={adminOpen}
        onClose={handleCloseAdmin}
        raceConfig={raceConfig}
        onSaveConfig={handleSaveConfig}
        onResetConfig={handleResetConfig}
      />
    </div>
  );
}
