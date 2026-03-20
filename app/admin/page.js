"use client";

import { useState } from "react";
import Link from "next/link";

const initialForm = {
  adminPassword: "",
  category: "Танцы",
  title: "",
  audio: "",
  region: "RU / EU",
  velocity: 70,
  engagement: 70,
  repeatability: 80,
  saturation: 30,
  complexity: 20,
  face_fit: 80,
  risk: 20,
  note: "",
  trend_status: "rising",
};

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Не удалось добавить тренд.");
        setLoading(false);
        return;
      }

      setMessage("Тренд добавлен. Обнови главную страницу, чтобы его увидеть.");
      setForm((prev) => ({
        ...initialForm,
        adminPassword: prev.adminPassword,
      }));
    } catch (err) {
      setError("Произошла ошибка сети или сервера.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400";
  const cardClass =
    "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Админка трендов
              </h1>
              <p className="text-slate-600 mt-2">
                Здесь ты можешь добавлять новые тренды без SQL.
              </p>
            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            >
              На главную
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`${cardClass} mt-6 space-y-6`}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Пароль администратора
            </label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) => updateField("adminPassword", e.target.value)}
              className={inputClass}
              placeholder="Введи ADMIN_PASSWORD"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Категория</label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClass}
              >
                <option value="Танцы">Танцы</option>
                <option value="Пение">Пение</option>
                <option value="Липсинги">Липсинги</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Статус тренда
              </label>
              <select
                value={form.trend_status}
                onChange={(e) => updateField("trend_status", e.target.value)}
                className={inputClass}
              >
                <option value="hot">Уже в тренде</option>
                <option value="rising">Будет трендовым</option>
                <option value="avoid">Лучше не повторять</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Название тренда
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={inputClass}
              placeholder="Например: Lip-sync с резкой сменой эмоции"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Звук</label>
              <input
                type="text"
                value={form.audio}
                onChange={(e) => updateField("audio", e.target.value)}
                className={inputClass}
                placeholder="Название звука"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Регион</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => updateField("region", e.target.value)}
                className={inputClass}
                placeholder="RU / EU"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["velocity", "Рост"],
              ["engagement", "Вовлечение"],
              ["repeatability", "Повторяемость"],
              ["saturation", "Перегретость"],
              ["complexity", "Сложность"],
              ["face_fit", "Face fit"],
              ["risk", "Риск"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">
                  {label}: {form[key]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form[key]}
                  onChange={(e) => updateField(key, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              className={`${inputClass} min-h-[120px]`}
              placeholder="Почему этот тренд стоит повторять или избегать?"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-2xl text-sm font-medium bg-slate-900 text-white disabled:opacity-60"
          >
            {loading ? "Добавление..." : "Добавить тренд"}
          </button>
        </form>
      </div>
    </div>
  );
}