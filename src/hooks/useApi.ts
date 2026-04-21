import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Initialize socket outside component to avoid reconnects, 
// but we will connect/disconnect based on auth state in a hook if needed.
let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL);
  }
  return socket;
};

// Generic fetch hook
export function useApi<T>(endpoint: string, options: RequestInit = {}, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!user?.token) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
            ...options.headers,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const json = await response.json();
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user?.token, endpoint, ...dependencies]);

  return { data, setData, loading, error };
}

// API Utilities
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
};
