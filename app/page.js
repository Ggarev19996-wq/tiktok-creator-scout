"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Flame, TrendingUp, ShieldAlert, Sparkles, PlayCircle, BarChart3, CheckCircle2 } from 'lucide-react';

const seedTrends = [
  {
    id: 1,
    category: 'Танцы',
    title: 'Простой dance-loop на 8 счётов',
    audio: 'Upbeat remix / female vocal cut',
    region: 'EU / Global',
    velocity: 92,
    engagement: 79,
    repeatability: 95,
    saturation: 58,
    complexity: 24,
    faceFit: 91,
    risk: 18,
    note: 'Высокая повторяемость, быстро считывается с первого просмотра, подходит для массового ремейка.',
  },
  {
    id: 2,
    category: 'Липсинги',
    title: 'Диалоговый lip-sync с резкой сменой эмоции',
    audio: 'Short dialogue meme sound',
    region: 'US / EU',
    velocity: 88,
    engagement: 84,
    repeatability: 90,
    saturation: 49,
    complexity: 21,
    faceFit: 94,
    risk: 16,
    note: 'Хорошо работает за счёт узнаваемого шаблона и сильного первого кадра.',
  },
  {
    id: 3,
    category: 'Пение',
    title: 'Acapella hook с резким входом в припев',
    audio: 'Trending chorus cut',
    region: 'Global',
    velocity: 81,
    engagement: 76,
    repeatability: 72,
    saturation: 41,
    complexity: 38,
    faceFit: 85,
    risk: 20,
    note: 'Может выстрелить, если сильный голос и понятная эмоция уже в первые 1–2 секунды.',
  },
  {
    id: 4,
    category: 'Танцы',
    title: 'Сложная хореография с быстрым монтажом',
    audio: 'Fast bpm club edit',
    region: 'Global',
    velocity: 63,
    engagement: 55,
    repeatability: 39,
    saturation: 83,
    complexity: 88,
    faceFit: 44,
    risk: 74,
    note: 'Слишком сложно повторить массово, высокий риск потеряться среди сильных оригиналов.',
  },
  {
    id: 5,
    category: 'Липсинги',
    title: 'Мини-скетч + lip-sync с подписью',
    audio: 'Sarcastic audio clip',
    region: 'EU',
    velocity: 76,
    engagement: 82,
    repeatability: 87,
    saturation: 35,
    complexity: 29,
    faceFit: 89,
    risk: 22,
    note: 'Очень хороший кандидат в растущий тренд: ещё не перегрет, но уже есть реакция аудитории.',
  },
  {
    id: 6,
    category: 'Пение',
    title: 'Кавер на перегретый звук без хука',
    audio: 'Overused ballad excerpt',
    region: 'Global',
    velocity: 48,
    engagement: 52,
    repeatability: 46,
    saturation: 91,
    complexity: 58,
    faceFit: 61,
    risk: 71,
    note: 'Аудитория устала от формата, шанс на пробой низкий без сильного уникального угла.',
  },
  {
    id: 7,
    category: 'Танцы',
    title: 'Переход outfit + micro-dance',
    audio: 'Fashion beat transition',
    region: 'EU / CIS',
    velocity: 86,
    engagement: 80,
    repeatability: 92,
    saturation: 44,
    complexity: 27,
    faceFit: 96,
    risk: 14,
    note: 'Лучший баланс простоты, визуального хука и потенциала ремейков.',
  },
  {
    id: 8,
    category: 'Липсинги',
    title: 'Нишевый мем на локальный инфоповод',
    audio: 'Local meme cut',
    region: 'Local only',
    velocity: 57,
    engagement: 69,
    repeatability: 65,
    saturation: 22,
    complexity: 26,
    faceFit: 83,
    risk: 39,
    note: 'Может локально стрельнуть, но плохо масштабируется как универсальный шаблон.',
  },
  {
    id: 9,
    category: 'Пение',
    title: 'Soft vocal + close-up storytelling',
    audio: 'Warm female acoustic cut',
    region: 'Global',
    velocity: 74,
    engagement: 78,
    repeatability: 73,
    saturation: 31,
    complexity: 34,
    faceFit: 90,
    risk: 17,
    note: 'Неплохой rising-формат: работает на эмоциональной близости и простом визуале.',
  },
];

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function trendScore(item) {
  return Math.round(
    item.velocity * 0.28 +
      item.engagement * 0.22 +
      item.repeatability * 0.22 +
      item.faceFit * 0.12 +
      (100 - item.saturation) * 0.08 +
      (100 - item.complexity) * 0.05 +
      (100 - item.risk) * 0.03
  );
}

function trendLabel(item) {
  const score = trendScore(item);
  if (score >= 79 && item.saturation < 70) return 'Уже в тренде';
  if (score >= 66 && item.saturation <= 55) return 'Будет трендовым';
  return 'Лучше не повторять';
}

function trendColor(label) {
  if (label === 'Уже в тренде') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (label === 'Будет трендовым') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function recommendation(item) {
  const label = trendLabel(item);
  if (label === 'Уже в тренде') {
    return 'Повторять можно прямо сейчас, но нужен свой угол: образ, переход, эмоция или подпись.';
  }
  if (label === 'Будет трендовым') {
    return 'Хорошая возможность войти раньше массы. Лучше публиковать быстро и тестировать 2–3 вариации.';
  }
  return 'Не копировать в лоб. Брать только отдельные элементы: хук, звук, подачу или монтажный принцип.';
}

const statCard = 'rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4';

export default function TikTokCreatorScoutDemo() {
  const [tab, setTab] = useState('dashboard');
  const [selectedCategories, setSelectedCategories] = useState(['Танцы', 'Пение', 'Липсинги']);
  const [search, setSearch] = useState('');
  const [fileMeta, setFileMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const videoRef = useRef(null);

  const [inputs, setInputs] = useState({
    hook: 7,
    trendMatch: 7,
    beatSync: 7,
    visualClarity: 8,
    facePresence: 8,
    captionStrength: 6,
    originality: 6,
    replayValue: 7,
    simplicity: 8,
  });

  const trendData = useMemo(() => {
    return seedTrends
      .map((item) => ({ ...item, score: trendScore(item), label: trendLabel(item) }))
      .filter((item) => selectedCategories.includes(item.category))
      .filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [item.title, item.audio, item.category, item.region, item.note].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedCategories, search]);

  const topNow = trendData.filter((t) => t.label === 'Уже в тренде');
  const topRising = trendData.filter((t) => t.label === 'Будет трендовым');
  const avoid = trendData.filter((t) => t.label === 'Лучше не повторять');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const durationScore = useMemo(() => {
    if (!fileMeta?.duration) return 65;
    const d = fileMeta.duration;
    if (d >= 8 && d <= 18) return 92;
    if (d > 18 && d <= 28) return 78;
    if (d >= 5 && d < 8) return 75;
    return 58;
  }, [fileMeta]);

  const fileSizeScore = useMemo(() => {
    if (!fileMeta?.sizeMb) return 70;
    if (fileMeta.sizeMb <= 80) return 85;
    if (fileMeta.sizeMb <= 150) return 75;
    return 60;
  }, [fileMeta]);

  const algorithmChance = useMemo(() => {
    const raw =
      inputs.hook * 10 * 0.18 +
      inputs.trendMatch * 10 * 0.18 +
      inputs.beatSync * 10 * 0.1 +
      inputs.visualClarity * 10 * 0.1 +
      inputs.facePresence * 10 * 0.08 +
      inputs.captionStrength * 10 * 0.07 +
      inputs.originality * 10 * 0.09 +
      inputs.replayValue * 10 * 0.1 +
      inputs.simplicity * 10 * 0.05 +
      durationScore * 0.03 +
      fileSizeScore * 0.02;
    return clamp(Math.round(raw));
  }, [inputs, durationScore, fileSizeScore]);

  const likePotential = useMemo(() => {
    const raw = algorithmChance * 0.55 + inputs.facePresence * 10 * 0.12 + inputs.originality * 10 * 0.18 + inputs.captionStrength * 10 * 0.15;
    return clamp(Math.round(raw));
  }, [algorithmChance, inputs]);

  const viewPotential = useMemo(() => {
    const raw = algorithmChance * 0.68 + inputs.hook * 10 * 0.12 + inputs.replayValue * 10 * 0.2;
    return clamp(Math.round(raw));
  }, [algorithmChance, inputs]);

  const videoVerdict = useMemo(() => {
    if (algorithmChance >= 80) return 'Сильный кандидат';
    if (algorithmChance >= 65) return 'Нужна доработка';
    return 'Риск слабого охвата';
  }, [algorithmChance]);

  const matchedIdeas = useMemo(() => {
    return [...seedTrends]
      .map((item) => ({ ...item, score: Math.round(item.repeatability * 0.35 + item.faceFit * 0.2 + item.velocity * 0.2 + inputs.trendMatch * 10 * 0.25) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [inputs.trendMatch]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const loadVideoMeta = (file) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      setFileMeta({
        name: file.name,
        duration: Number(video.duration.toFixed(1)),
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
        type: file.type || 'video/*',
      });
    };
  };

  const scoreBar = (value) => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full bg-slate-900" style={{ width: `${value}%` }} />
    </div>
  );

  const sectionTitle = (icon, title, subtitle) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">{icon}<span>{title}</span></div>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-slate-200 bg-white/90 shadow-sm p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-50">
                <Sparkles className="h-3.5 w-3.5" /> MVP для личного использования и будущей продажи
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">TikTok Creator Scout</h1>
              <p className="text-slate-600 mt-3 max-w-3xl text-base md:text-lg">
                Демо-инструмент для поиска повторяемых трендов в категориях танцы, пение и lip-sync, с разметкой:
                <span className="font-medium"> уже в тренде</span>, <span className="font-medium">будет трендовым</span> и <span className="font-medium">лучше не повторять</span>.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-full lg:min-w-[420px]">
              <div className={statCard}><div className="text-xs text-slate-500">Трендов сейчас</div><div className="text-2xl font-semibold mt-1">{topNow.length}</div></div>
              <div className={statCard}><div className="text-xs text-slate-500">На подходе</div><div className="text-2xl font-semibold mt-1">{topRising.length}</div></div>
              <div className={statCard}><div className="text-xs text-slate-500">Избегать</div><div className="text-2xl font-semibold mt-1">{avoid.length}</div></div>
              <div className={statCard}><div className="text-xs text-slate-500">MVP score</div><div className="text-2xl font-semibold mt-1">84/100</div></div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ['dashboard', 'Обзор'],
            ['trends', 'Тренды'],
            ['upload', 'Анализ видео'],
            ['plan', 'План запуска'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium border transition ${tab === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {sectionTitle(<Flame className="h-5 w-5" />, 'Что сейчас выглядит сильнее всего', 'Приоритет на форматы, которые легко повторить девушке и быстро адаптировать под свой стиль.')}
              <div className="grid md:grid-cols-2 gap-4">
                {trendData.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500">{item.category} · {item.region}</div>
                        <div className="font-semibold mt-1">{item.title}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${trendColor(item.label)}`}>{item.label}</span>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">{item.note}</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500"><span>Общий score</span><span>{item.score}/100</span></div>
                      {scoreBar(item.score)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {sectionTitle(<BarChart3 className="h-5 w-5" />, 'Логика MVP', 'Как именно этот демо-инструмент принимает решение.')}
              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">Уже в тренде</div>
                  <div className="mt-1">Высокая скорость роста + хорошая повторяемость + умеренная перегретость.</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">Будет трендовым</div>
                  <div className="mt-1">Есть импульс, но формат ещё не перегружен копиями.</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">Лучше не повторять</div>
                  <div className="mt-1">Слишком сложно, слишком поздно или слишком мало повторяемости.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'trends' && (
          <div className="mt-6 grid xl:grid-cols-[320px,1fr] gap-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm h-fit">
              {sectionTitle(<TrendingUp className="h-5 w-5" />, 'Фильтры', 'Оставь только нужные категории и найди релевантные форматы.')}
              <div className="space-y-3">
                {['Танцы', 'Пение', 'Липсинги'].map((category) => (
                  <label key={category} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 cursor-pointer">
                    <span className="font-medium">{category}</span>
                    <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="h-4 w-4" />
                  </label>
                ))}
              </div>
              <div className="mt-5">
                <div className="text-sm font-medium mb-2">Поиск</div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="звук, формат, регион..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </div>
            </div>

            <div className="space-y-4">
              {trendData.map((item) => (
                <motion.div layout key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="text-sm text-slate-500">{item.category} · {item.region} · звук: {item.audio}</div>
                      <h3 className="text-xl font-semibold mt-1">{item.title}</h3>
                      <p className="text-slate-600 mt-3">{item.note}</p>
                      <p className="text-sm text-slate-500 mt-3">{recommendation(item)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-sm px-3 py-1.5 rounded-full border ${trendColor(item.label)}`}>{item.label}</span>
                      <span className="text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">Score {item.score}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-3 mt-5 text-sm">
                    {[
                      ['Рост', item.velocity],
                      ['Вовлечение', item.engagement],
                      ['Повторяемость', item.repeatability],
                      ['Перегретость', item.saturation],
                      ['Сложность', item.complexity],
                      ['Риск', item.risk],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-slate-500 text-xs">{label}</div>
                        <div className="text-lg font-semibold mt-1">{value}/100</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div className="mt-6 grid xl:grid-cols-[1.1fr,0.9fr] gap-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {sectionTitle(<Upload className="h-5 w-5" />, 'Анализ собственного видео', 'В демо используется гибрид: метаданные файла + ручная оценка ключевых факторов ролика.')}
              <label className="block rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center cursor-pointer hover:border-slate-400 transition">
                <div className="flex justify-center"><PlayCircle className="h-10 w-10 text-slate-500" /></div>
                <div className="mt-3 font-medium">Загрузить видео</div>
                <div className="text-sm text-slate-500 mt-1">mp4 / mov / webm — локальный анализ в браузере</div>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => loadVideoMeta(e.target.files?.[0])} />
              </label>

              {previewUrl && (
                <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200 bg-black">
                  <video ref={videoRef} src={previewUrl} controls className="w-full max-h-[360px] object-contain" />
                </div>
              )}

              {fileMeta && (
                <div className="grid md:grid-cols-3 gap-3 mt-5">
                  <div className={statCard}><div className="text-xs text-slate-500">Файл</div><div className="font-medium mt-1 break-all">{fileMeta.name}</div></div>
                  <div className={statCard}><div className="text-xs text-slate-500">Длительность</div><div className="font-medium mt-1">{fileMeta.duration} сек</div></div>
                  <div className={statCard}><div className="text-xs text-slate-500">Размер</div><div className="font-medium mt-1">{fileMeta.sizeMb} MB</div></div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {[
                  ['hook', 'Сила первых 2 секунд'],
                  ['trendMatch', 'Совпадение с трендом'],
                  ['beatSync', 'Попадание в бит / тайминг'],
                  ['visualClarity', 'Чистота картинки'],
                  ['facePresence', 'Выразительность лица / контакт'],
                  ['captionStrength', 'Сила подписи / текста'],
                  ['originality', 'Оригинальный угол'],
                  ['replayValue', 'Потенциал пересмотров'],
                  ['simplicity', 'Простота для зрителя'],
                ].map(([key, label]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{label}</span>
                      <span>{inputs[key]}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={inputs[key]}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full mt-3"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                {sectionTitle(<BarChart3 className="h-5 w-5" />, 'Итог анализа', 'Это не гарантия, а вероятностная оценка потенциала ролика для MVP.')}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    ['Шанс пробить алгоритмы', algorithmChance],
                    ['Потенциал по лайкам', likePotential],
                    ['Потенциал по просмотрам', viewPotential],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-600"><span>{label}</span><span className="font-semibold text-slate-900">{value}/100</span></div>
                      <div className="mt-3">{scoreBar(value)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-900 text-white p-5">
                  <div className="text-sm text-slate-300">Вердикт</div>
                  <div className="text-2xl font-semibold mt-1">{videoVerdict}</div>
                  <div className="text-sm text-slate-300 mt-2">
                    {videoVerdict === 'Сильный кандидат' && 'Публиковать можно после быстрой A/B доработки обложки, подписи или первого кадра.'}
                    {videoVerdict === 'Нужна доработка' && 'Есть потенциал, но лучше усилить первые секунды, эмоцию и привязку к формату.'}
                    {videoVerdict === 'Риск слабого охвата' && 'Лучше пересобрать хук, сократить ролик или выбрать более подходящий тренд.'}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                {sectionTitle(<CheckCircle2 className="h-5 w-5" />, 'Какие идеи подходят ролику', 'Подсказка, в какие трендовые шаблоны твой ролик проще всего упаковать.')}
                <div className="space-y-3">
                  {matchedIdeas.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                          <div className="font-medium mt-1">{item.title}</div>
                        </div>
                        <div className="text-sm font-semibold">{item.score}</div>
                      </div>
                      <div className="text-sm text-slate-600 mt-2">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'plan' && (
          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {sectionTitle(<Sparkles className="h-5 w-5" />, 'Как превратить это в реальный продукт', 'Пошаговая дорожная карта с минимальными затратами.')}
              <div className="space-y-4">
                {[
                  ['Этап 1 — Demo', 'Статический фронтенд, ручной скоринг, локальная загрузка видео, seed-база трендов, экспорт идей.'],
                  ['Этап 2 — MVP', 'Подключение сборщика трендов из публичных страниц TikTok Creative Center, базы Supabase и ежедневного обновления.'],
                  ['Этап 3 — Beta', 'Личный кабинет, сохранение анализов, история тестов, рейтинг форматов и простая монетизация.'],
                  ['Этап 4 — Product', 'Мульти-региональность, team-доступ, API, white-label и автогенерация контент-брифов.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-medium">{title}</div>
                    <div className="text-slate-600 text-sm mt-1">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              {sectionTitle(<ShieldAlert className="h-5 w-5" />, 'Что важно помнить', 'Чтобы инструмент можно было позже продавать как продукт.')}
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Нужно отделить демо-аналитику от обещаний результата: показывать именно вероятностный score.</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Источник трендов должен быть заменяемым: сегодня public pages, завтра официальный партнёрский источник.</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Монетизация лучше всего через подписку: solo creator / creator pro / agency.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
