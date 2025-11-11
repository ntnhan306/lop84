
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppData, Student, Schedule, MediaItem } from '../types';
import { useAppData } from '../hooks/useAppData';

interface AppContextType {
  data: AppData;
  setStudents: (students: Student[]) => void;
  setSchedule: (schedule: Schedule) => void;
  setMedia: (media: MediaItem[]) => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data, setStudents, setSchedule, setMedia } = useAppData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AppContext.Provider value={{ data, setStudents, setSchedule, setMedia, isAuthenticated, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
