"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rolling Task Tracker</h1>

      <div className="mb-4">
        <Input
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <Button className="mt-2" onClick={addTask}>Add Task</Button>
      </div>

      <Card className="mb-4">
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Today's Tasks</h2>
          {tasks.length === 0 && <p>No tasks for today.</p>}
          <ul>
            {tasks.map((task, i) => (
              <li key={i} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(i)}
                  className="mr-2"
                />
                <span className={task.done ? "line-through text-gray-500" : ""}>{task.text}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-4" onClick={rollToNextDay}>Roll to Next Day</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">History</h2>
          {history.length === 0 && <p>No completed tasks yet.</p>}
          <ul>
            {history.map((entry, i) => (
              <li key={i} className="mb-2">
                <strong>{entry.date}:</strong>
                <ul className="ml-4 list-disc">
                  {entry.tasks.map((task, j) => (
                    <li key={j}>{task.text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
