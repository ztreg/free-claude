import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizeUser = (session) => {
      const nextUser = session?.user ?? null;
      setUser((prevUser) => {
        if (prevUser?.id === nextUser?.id) {
          return prevUser;
        }
        return nextUser;
      });
      setLoading((prevLoading) => (prevLoading ? false : prevLoading));
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      normalizeUser(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      normalizeUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username, password) => {
    // For custom username auth, we'll use email format internally
    const email = `${username}@tompastocks.local`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    
    // Create profile with username
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username });
      
      if (profileError) throw profileError;
    }

    return data;
  };

  const signIn = async (username, password) => {
    const email = `${username}@tompastocks.local`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
