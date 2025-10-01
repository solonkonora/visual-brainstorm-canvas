'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { BACKEND_URL } from '@/lib/env';
import { USER_SERVICE_URL } from '@/lib/env';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

  // Call gateway for current user info (gateway will proxy to user service) coming back to this
  // const response = await fetch(`${BACKEND_URL}/users/me`, {
    const response = await fetch(`${USER_SERVICE_URL}/users/me`, {

        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.debug('fetchCurrentUser status', response.status);
      const body = await response.json().catch(() => null);
      console.debug('fetchCurrentUser body', body);

      if (response.ok && body) {
        // Accept multiple shapes: { user: {...} } | { data: { user: {...} } } | {...user}
        const userPayload = body.user || (body.data && body.data.user) || body;
        setUser(userPayload);
      } else {
        // If token is invalid or response not OK, remove it
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
  // Call the backend logout endpoint
  await fetch(`${USER_SERVICE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Remove the token from localStorage
      localStorage.removeItem('token');
      
      // Clear the user state
      setUser(null);
      
      // Redirect to the auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    fetchCurrentUser(); 
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchCurrentUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};