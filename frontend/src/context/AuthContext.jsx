/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const CURRENCIES = {
  USD: { symbol: "$", rate: 1.0 },
  EUR: { symbol: "€", rate: 0.92 },
  INR: { symbol: "₹", rate: 83.2 },
  GBP: { symbol: "£", rate: 0.79 }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState('USD');

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    if (user?.id) {
      localStorage.setItem(`currency_${user.id}`, curr);
    }
  };

  const formatVal = (valInUSD) => {
    const curr = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = valInUSD * curr.rate;
    return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // On mount – verify stored token
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getMe(storedToken);
          setUser(userData);
          setToken(storedToken);
          const stored = localStorage.getItem(`currency_${userData.id}`);
          if (stored) {
            setCurrencyState(stored);
          } else {
            localStorage.setItem(`currency_${userData.id}`, 'USD');
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    const stored = localStorage.getItem(`currency_${data.user.id}`);
    if (stored) {
      setCurrencyState(stored);
    } else {
      localStorage.setItem(`currency_${data.user.id}`, 'USD');
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    const stored = localStorage.getItem(`currency_${data.user.id}`);
    if (stored) {
      setCurrencyState(stored);
    } else {
      localStorage.setItem(`currency_${data.user.id}`, 'USD');
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, currency, setCurrency, formatVal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
