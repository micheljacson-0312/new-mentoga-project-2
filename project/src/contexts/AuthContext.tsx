import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UserRole = "admin" | "consultant" | "user";

export interface AuthUser extends User {
  role?: UserRole;
}

interface UserProfile {
  id: string;
  auth_id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  becomeConsultant: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(nextSession.user as AuthUser);
    await fetchProfile(nextSession.user.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        await applySession(session);
      } catch (err) {
        console.error("Init Auth error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          await applySession(null);
          setLoading(false);
          return;
        }

        await applySession(session);
        setLoading(false);
      }
    );

    init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authId: string) => {
    try {
      console.log("Fetching profile for auth_id:", authId);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
      } else if (authId) {
        // Automatically create missing profile
        console.log("Profile missing for authId in AuthContext, checking if we can create default...");
        const session = await supabase.auth.getSession();
        const email = session.data.session?.user.email;
        
        if (email) {
          const { data: newProfile } = await supabase
            .from("user_profiles")
            .insert([{
              auth_id: authId,
              email: email,
              role: "user"
            }])
            .select()
            .maybeSingle();

          if (newProfile) {
            setProfile(newProfile as UserProfile);
          } else {
            // Re-fetch in case a trigger created it while we were inserting
            const { data: retryData } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("auth_id", authId)
              .maybeSingle();
            if (retryData) {
              setProfile(retryData as UserProfile);
            } else {
              setProfile(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Critical error fetching profile:", error);
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Try to create profile, but don't block signup if it fails
        try {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert([
              {
                auth_id: data.user.id,
                email,
                role: "user",
                first_name: firstName,
                last_name: lastName,
              },
            ]);

          if (profileError) {
            console.error("Profile creation error (non-fatal):", profileError);
          }
        } catch (profileErr) {
          console.error("Profile insert failed (non-fatal):", profileErr);
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear UI state immediately so the app can return to public pages without waiting.
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      localStorage.removeItem("mentoga_currentPage");
      localStorage.removeItem("mentoga-auth");

      Object.keys(localStorage)
        .filter((key) => key.startsWith("sb-") || key.includes("supabase"))
        .forEach((key) => localStorage.removeItem(key));

      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("sb-") || key.includes("supabase"))
        .forEach((key) => sessionStorage.removeItem(key));

      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile?.id) throw new Error("No profile found");

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(data)
        .eq("id", profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...data });
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc("check_email_exists", {
        email_to_check: email,
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error("Check email exists error:", error);
      return false;
    }
  };

  const becomeConsultant = async () => {
    if (!profile?.id) throw new Error("No profile found");

    try {
      const { error } = await supabase
        .from("consultants")
        .insert([
          {
            user_id: profile.id,
            expertise_tags: [],
            hourly_rate: 0,
            languages: [],
          },
        ]);

      if (error) throw error;

      await updateProfile({ role: "consultant" });
    } catch (error) {
      console.error("Become consultant error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        becomeConsultant,
        refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
        checkEmailExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
