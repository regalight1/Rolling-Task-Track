"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const sendMagicLink = async () => {
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://rolling-task-track.vercel.app",
      },
    });

    if (error) setMessage(error.message);
    else setMessage("Check your email for the sign-in link.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return (
      <div style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
        <h1>Rolling Task Tracker</h1>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />

        <button onClick={sendMagicLink} style={{ padding: "0.5rem 1rem" }}>
          Send magic link
        </button>

        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <h1>Rolling Task Tracker</h1>
      <p>Signed in as:</p>
      <strong>{session.user.email}</strong>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
