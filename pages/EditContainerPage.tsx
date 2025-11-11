
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import EditPage from './EditPage';
import AuthForm from '../components/AuthForm';

const PASSWORD_KEY = 'lop84_password_hash';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const EditContainerPage: React.FC = () => {
  const { isAuthenticated, login } = useAppContext();
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedHash = localStorage.getItem(PASSWORD_KEY);
    setPasswordHash(storedHash);
    setIsLoading(false);
  }, []);

  const handleSetPassword = async (password: string) => {
    const newHash = await hashPassword(password);
    localStorage.setItem(PASSWORD_KEY, newHash);
    setPasswordHash(newHash);
    login();
  };

  const handleLogin = async (password: string) => {
    if (!passwordHash) return false;
    const inputHash = await hashPassword(password);
    if (inputHash === passwordHash) {
      login();
      return true;
    }
    return false;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  if (isAuthenticated) {
    return <EditPage />;
  }

  if (!passwordHash) {
    return <AuthForm type="set" onSubmit={handleSetPassword} />;
  }

  return <AuthForm type="login" onSubmit={handleLogin} />;
};

export default EditContainerPage;
