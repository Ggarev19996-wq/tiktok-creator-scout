"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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

function statusLabel(value) {
  if (value === "hot") return "Уже в тренде";
  if (value === "rising") return "Будет трендовым";
  return "Лучше не повторять";
}

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [deactivateLoadingId, setDeactivateLoadingId] = useState("");
  const [restoreLoadingId, setRestoreLoadingId] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [trends, setTrends] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadTrends() {
    setListLoading(true);

    const { data, error } = await supabase
      .from("trends")
      .select(
        "id, category, title, audio, region, velocity, engagement, repeatability, saturation, complexity, face_fit, risk, note, trend_status, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError("Не удалось загрузить список трендов.");
      setListLoading(false);
      return;
    }

    setTrends(data || []);
    setListLoading(false);
  }

  useEffect(() => {
    loadTrends();
  }, []);

  function startEditing(trend) {
    setMessage("");
    setError("");
    setEditingId(trend.id);

    setForm((prev) => ({
      ...prev,
      category: trend.category || "Танцы",
      title: trend.title || "",
      audio: trend.audio || "",
      region: trend.region || "Global",
      velocity: trend.velocity ?? 70,
      engagement: trend.engagement ?? 70,
      repeatability: trend.repeatability ?? 80,
      saturation: trend.saturation ?? 30,
      complexity: trend.complexity ?? 20,
      face_fit: trend.face_fit ?? 80,
      risk: trend.risk ?? 20,
      note: trend.note || "",
      trend_status: trend.trend_status || "rising",
    }));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId("");
    setMessage("");
    setError("");

    setForm((prev) => ({
      ...initialForm,
      adminPassword: prev.adminPassword,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const method = editingId ? "PUT" : "POST";

      const response = await fetch("/api/admin/trends", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: editingId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Не удалось сохранить тренд.");
        setLoading(false);
        return;
      }

      setMessage(editingId ? "Тренд обновлён." : "Тренд добавлен.");

      setForm((prev) => ({
        ...initialForm,
        adminPassword: prev.adminPassword,
      }));

      setEditingId("");
      await loadTrends();
    } catch {
      setError("Произошла ошибка сети или сервера.");
    } finally {
      setLoading(false);
    }
  }

  async function setTrendActiveState(id, isActive, type) {
    if (!form.adminPassword) {
      setError("Сначала введи пароль администратора в верхнем поле.");
      return;
    }

    setMessage("");
    setError("");

    if (type === "deactivate") setDeactivateLoadingId(id);
    if (type === "restore") setRestoreLoadingId(id);

    try {
      const response = await fetch("/api/admin/trends", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          is_active: isActive,
          adminPassword: form.adminPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Не удалось изменить статус тренда.");
        return;
      }

      setMessage(isActive ? "Тренд восстановлен." : "Тренд отключён.");
      await loadTrends();
    } catch {
      setError("Произошла ошибка сети или сервера.");
    } finally {
      setDeactivateLoadingId("");
      setRestoreLoadingId("");
    }
  }

  async function deleteTrend(id) {
    if (!form.adminPassword) {
      setError("Сначала введи пароль администратора в верхнем поле.");
      return;
    }

    setDeleteLoadingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/trends", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          adminPassword: form.adminPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Не удалось удалить тренд.");
        setDeleteLoadingId("");
        return;
      }

      if (editingId === id) {
        cancelEditing();
      }

      setMessage("Тренд удалён.");
      await loadTrends();
    } catch {
      setError("Произошла ошибка сети или сервера.");
    } finally {
      setDeleteLoadingId("");
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400";
  const cardClass =
    "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Админка трендов
              </h1>
              <p className="text-slate-600 mt-2">
                Здесь ты можешь добавлять, редактировать, восстанавливать,
                отключать и удалять тренды.
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold">
                {editingId ? "Редактирование тренда" : "Добавление нового тренда"}
              </h2>
              <p className="text-slate-600 mt-1">
                {editingId
                  ? "Измени поля и нажми «Сохранить изменения»."
                  : "Заполни форму и нажми «Добавить тренд»."}
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              >
                Отменить редактирование
              </button>
            ) : null}
          </div>

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

          <div className="flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl text-sm font-medium bg-slate-900 text-white disabled:opacity-60"
            >
              {loading
                ? editingId
                  ? "Сохранение..."
                  : "Добавление..."
                : editingId
                ? "Сохранить изменения"
                : "Добавить тренд"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={cancelEditing}
                className="px-5 py-3 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>

        <div className={`${cardClass} mt-6`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold">Все тренды</h2>
              <p className="text-slate-600 mt-1">
                Здесь можно редактировать, отключать, восстанавливать и удалять.
              </p>
            </div>

            <button
              onClick={loadTrends}
              className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            >
              Обновить список
            </button>
          </div>

          {listLoading ? (
            <div className="mt-6 text-slate-600">Загрузка списка...</div>
          ) : trends.length === 0 ? (
            <div className="mt-6 text-slate-600">Трендов пока нет.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs text-slate-500">
                        {trend.category} · {trend.region || "Global"}
                      </div>
                      <div className="font-semibold text-lg mt-1">
                        {trend.title}
                      </div>
                      <div className="text-sm text-slate-500 mt-2">
                        Статус: {statusLabel(trend.trend_status)} ·{" "}
                        {trend.is_active ? "Активен" : "Отключён"}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => startEditing(trend)}
                        className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      >
                        Редактировать
                      </button>

                      {trend.is_active ? (
                        <button
                          type="button"
                          onClick={() => setTrendActiveState(trend.id, false, "deactivate")}
                          disabled={deactivateLoadingId === trend.id}
                          className="px-4 py-2 rounded-2xl text-sm font-medium bg-slate-900 text-white disabled:opacity-60"
                        >
                          {deactivateLoadingId === trend.id
                            ? "Отключение..."
                            : "Отключить"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTrendActiveState(trend.id, true, "restore")}
                          disabled={restoreLoadingId === trend.id}
                          className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-slate-700 border-slate-200 hover:border-slate-300 disabled:opacity-60"
                        >
                          {restoreLoadingId === trend.id
                            ? "Восстановление..."
                            : "Восстановить"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteTrend(trend.id)}
                        disabled={deleteLoadingId === trend.id}
                        className="px-4 py-2 rounded-2xl text-sm font-medium border bg-white text-rose-700 border-rose-200 hover:border-rose-300 disabled:opacity-60"
                      >
                        {deleteLoadingId === trend.id ? "Удаление..." : "Удалить"}
                      </button>
                    </div>
                  </div>

                  {trend.audio ? (
                    <div className="text-sm text-slate-600 mt-3">
                      Звук: {trend.audio}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}