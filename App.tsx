
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ViewPage from './pages/ViewPage';
import EditContainerPage from './pages/EditContainerPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/view" replace />} />
          <Route path="/view" element={<ViewPage />} />
          <Route path="/edit" element={<EditContainerPage />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
