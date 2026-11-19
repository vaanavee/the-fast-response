import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { UserPortal } from './pages/UserPortal';
import { DriverPortal } from './pages/DriverPortal';
import { createDispatchWebSocket } from './services/api';

export const App: React.FC = () => {
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    const wsClient = createDispatchWebSocket(
      (data) => {
        console.log('[Dispatcher Event]', data);
      },
      (status) => {
        setWsConnected(status);
      }
    );

    return () => {
      wsClient.close();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
        <Navbar wsConnected={wsConnected} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<UserPortal />} />
            <Route path="/driver" element={<DriverPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
