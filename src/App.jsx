import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CircuitSection from './components/CircuitSection';
import GallerySection from './components/GallerySection';
import InfoFaqSection from './components/InfoFaqSection';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';
import {
  getLocalCachedRaceConfig,
  fetchLiveRaceConfig,
  saveLiveRaceConfig,
  resetLiveRaceConfig,
} from './firebase/config';

const AdminModal = lazy(() => import('./components/AdminModal'));

function isAdminUrl() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash === '#admin' ||
    window.location.pathname.replace(/\/+$/, '') === '/admin'
  );
}

export default function App() {
  const [raceConfig, setRaceConfig] = useState(() => getLocalCachedRaceConfig());
  const [activeDistance, setActiveDistance] = useState('27K');
  const [modalOpen, setModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(() => isAdminUrl());

  useEffect(() => {
    const onHashChange = () => {
      if (isAdminUrl()) {
        setAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    // En modo ahorro de datos (señal de montaña 3G/Edge), diferimos la carga de Firebase
    // hasta que el corredor busque un dorsal o abra el panel de administración.
    const saveDataEnabled = Boolean(navigator.connection?.saveData);
    let idleId = null;
    let fallbackTimer = null;

    if (!saveDataEnabled) {
      const loadRemoteConfig = async () => {
        const result = await fetchLiveRaceConfig();
        if (result?.config) {
          setRaceConfig(result.config);
        }
      };

      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(loadRemoteConfig, { timeout: 2000 });
      } else {
        fallbackTimer = setTimeout(loadRemoteConfig, 1500);
      }
    }

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);

  const handleOpenModal = (distanceOverride) => {
    if (distanceOverride === '27K' || distanceOverride === '13K') {
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col overflow-x-hidden">
      <Navbar onOpenModal={() => handleOpenModal(activeDistance)} onOpenAdmin={() => setAdminOpen(true)} />

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

      {adminOpen && (
        <Suspense fallback={null}>
          <AdminModal
            isOpen={adminOpen}
            onClose={handleCloseAdmin}
            raceConfig={raceConfig}
            onSaveConfig={handleSaveConfig}
            onResetConfig={handleResetConfig}
          />
        </Suspense>
      )}
    </div>
  );
}
