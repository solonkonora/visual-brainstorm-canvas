'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BACKEND_URL } from '@/lib/env';

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

  // Remove mock authentication - use real auth service
  // useEffect(() => {
  //   const mockToken = 'mock-jwt-token-for-testing';
  //   if (!localStorage.getItem('token')) {
  //     localStorage.setItem('token', mockToken);
  //   }
  // }, []);

  const fetchCurrentUser = async () => {
    console.log('👤 DEBUG: fetchCurrentUser called');
    try {
      const token = localStorage.getItem('token');
      console.log('👤 DEBUG: Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('👤 DEBUG: No token, setting user to null');
        setUser(null);
        setLoading(false);
        return;
      }

      // Call user service for current user info
      const userServiceUrl = 'http://localhost:3004/users/me';
      console.log('👤 DEBUG: Making request to user service:', userServiceUrl);
      console.log('👤 DEBUG: Request headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
      });

      const response = await fetch(userServiceUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('👤 DEBUG: User service response status:', response.status);
      console.log('👤 DEBUG: User service response ok:', response.ok);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('👤 DEBUG: User data received:', userData);
        setUser(userData);
      } else {
        // If token is invalid, remove it
        console.warn('👤 DEBUG: Invalid response, removing token');
        const errorText = await response.text();
        console.error('👤 DEBUG: Response error:', errorText);
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('👤 DEBUG: Error fetching current user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      console.log('👤 DEBUG: Setting loading to false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call the backend logout endpoint
        await fetch(`${BACKEND_URL}/auth/logout`, {
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
      // Even if there's an error, we still want to clear the local state
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    console.log('👤 DEBUG: UserProvider useEffect triggered - starting to fetch current user');
    fetchCurrentUser(); // Enable real user fetching
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