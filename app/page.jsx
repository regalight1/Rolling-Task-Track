"use client";
import { useState, useEffect } from "react";

export default function DailyTaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const savedHistory = JSON.parse(localStorage.getItem("history")) || [];
    setTasks(savedTasks);
    setHistory(savedHistory);
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("history", JSON.stringify(history));
  }, [tasks, history]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { text: newTask, done: false }]);
      setNewTask("");
    }
  };

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  const rollToNextDay = () => {
    const completed = tasks.filter((task) => task.done);
    const incomplete = tasks.filter((task) => !task.done);
    if (completed.length) {
      const date = new Date().toISOString().split("T")[0];
      setHistory([...history, { date, tasks: completed }]);
    }
    setTasks(incomplete);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Rolling Task Tracker
      </h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ padding: "0.5rem", width: "100%", marginBottom: "0.5rem" }}
        />
        <button onClick={addTask} style={{ padding: "0.5rem 1rem", background: "#1d4ed8", color: "white", border: "none", borderRadius: "4px" }}>
          Add Task
        </button>
      </div>

      <div style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
        <h2 style={{ fontWeight: "bold", marginBottom: "1rem" }}>Today's Tasks</h2>
        {tasks.length === 0 && <p>No tasks for today.</p>}
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {tasks.map((task, i) => (
            <li key={i} style={{ marginBottom: "0.5rem" }}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(i)}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ textDecoration: task.done ? "line-through" : "none", color: task.done ? "#888" : "#000" }}>
                  {task.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button onClick={rollToNextDay} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: "4px" }}>
          Roll to Next Day
        </button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
        <h2 style={{ fontWeight: "bold", marginBottom: "1rem" }}>History</h2>
        {history.length === 0 && <p>No completed tasks yet.</p>}
        <ul style={{ paddingLeft: "1rem" }}>
          {history.map((entry, i) => (
            <li key={i} style={{ marginBottom: "0.5rem" }}>
              <strong>{entry.date}:</strong>
              <ul style={{ marginLeft: "1rem" }}>
                {entry.tasks.map((task, j) => (
                  <li key={j}>{task.text}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

