"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PRIORITIES = [
  { label: "High", value: "high", rank: 0 },
  { label: "Medium", value: "medium", rank: 1 },
  { label: "Low", value: "low", rank: 2 },
];

const priorityRank = (p) => PRIORITIES.find((x) => x.value === p)?.rank ?? 1;
const priorityLabel = (p) => PRIORITIES.find((x) => x.value === p)?.label ?? "Medium";

export default function RollingTaskTracker() {
  const [session, setSession] = useState(null);

  // auth UI
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // app UI
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // --- auth session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const sendMagicLink = async () => {
    setAuthMsg("");
    const e = email.trim();
    if (!e) return;

    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: "https://rolling-task-track.vercel.app" },
    });

    setAuthMsg(error ? error.message : "Check your email for the sign-in link.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTasks([]);
  };

  // --- data load ---
  const loadTasks = async () => {
    if (!session?.user?.id) return;
    setErrMsg("");
    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select("id, user_id, text, done, priority, created_at, due_at")
      .order("created_at", { ascending: true });

    setLoading(false);
    if (error) {
      setErrMsg(error.message);
      return;
    }
    setTasks(data ?? []);
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [tasks]);

  // --- actions ---
  const addTask = async () => {
    const text = newTask.trim();
    if (!text || !session?.user?.id) return;

    setErrMsg("");
    const payload = {
      user_id: session.user.id,
      text,
      done: false,
      priority: newPriority,
    };

    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error) {
      setErrMsg(error.message);
      return;
    }

    setTasks((prev) => [...prev, data]);
    setNewTask("");
    setNewPriority("medium");
  };

  const toggleTask = async (task) => {
    setErrMsg("");
    const { data, error } = await supabase
      .from("tasks")
      .update({ done: !task.done })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      setErrMsg(error.message);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
  };

  // Keep "rolling" behavior simple for now:
  // completed tasks are removed from today's list (deleted).
  // Next step will add a history table instead of delete.
  const rollToNextDay = async () => {
    const completed = tasks.filter((t) => t.done);
    if (completed.length === 0) return;

    setErrMsg("");
    const ids = completed.map((t) => t.id);

    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) {
      setErrMsg(error.message);
      return;
    }

    setTasks((prev) => prev.filter((t) => !t.done));
  };

  // --- UI ---
  if (!session) {
    return (
      <div style={{ padding: "2rem", maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Rolling Task Tracker
        </h1>

        <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: 8 }}>
          <h2 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Sign in</h2>
          <p style={{ marginTop: 0, color: "#555" }}>
            Enter your email and we’ll send you a sign-in link.
          </p>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
          />

          <button
            onClick={sendMagicLink}
            style={{ padding: "0.5rem 1rem", background: "#1d4ed8", color: "white", border: "none", borderRadius: 4 }}
          >
            Send magic link
          </button>

          {authMsg && <p style={{ marginTop: "0.75rem" }}>{authMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Rolling Task Tracker</h1>
        <button onClick={signOut} style={{ padding: "0.4rem 0.75rem" }}>
          Sign out
        </button>
      </div>

      <p style={{ marginTop: "0.25rem", color: "#555" }}>
        Signed in as <strong>{session.user.email}</strong>
      </p>

      {errMsg && (
        <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #fca5a5", borderRadius: 6 }}>
          <strong>Error:</strong> {errMsg}
        </div>
      )}

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ padding: "0.5rem", width: "100%", marginBottom: "0.5rem" }}
        />

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ padding: "0.5rem", flex: 1 }}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                Priority: {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={addTask}
            style={{ padding: "0.5rem 1rem", background: "#1d4ed8", color: "white", border: "none", borderRadius: 4 }}
          >
            Add Task
          </button>

          <button onClick={loadTasks} style={{ padding: "0.5rem 0.75rem" }} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: 8 }}>
        <h2 style={{ fontWeight: "bold", marginBottom: "1rem" }}>Today’s Tasks</h2>

        {sortedTasks.length === 0 && <p>No tasks for today.</p>}

        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {sortedTasks.map((task) => (
            <li key={task.id} style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task)} />
                <span style={{ textDecoration: task.done ? "line-through" : "none", flex: 1 }}>
                  {task.text}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>{priorityLabel(task.priority)}</span>
              </label>
            </li>
          ))}
        </ul>

        <button
          onClick={rollToNextDay}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: 4 }}
        >
          Roll to Next Day (removes completed)
        </button>
      </div>
    </div>
  );
}
