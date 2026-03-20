import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) return null;

  return createClient(url, secret);
}

function checkAdminPassword(body) {
  if (!process.env.ADMIN_PASSWORD) {
    return { ok: false, message: "На сервере не найден ADMIN_PASSWORD." };
  }

  if (body.adminPassword !== process.env.ADMIN_PASSWORD) {
    return { ok: false, message: "Неверный пароль администратора." };
  }

  return { ok: true };
}

function clamp01to10(value, fallback = 5) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(10, Math.round(num)));
}

function clamp01to100(value, fallback = 50) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export async function POST(request) {
  try {
    const adminClient = getAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Не найдены переменные Supabase для сервера." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const passwordCheck = checkAdminPassword(body);

    if (!passwordCheck.ok) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 401 }
      );
    }

    if (body.action === "list") {
      const { data, error } = await adminClient
        .from("video_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json(
          { error: `Ошибка Supabase: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    if (body.action === "save") {
      const payload = {
        file_name: body.file_name || "Без названия",
        file_type: body.file_type || "video/*",
        duration_seconds: Number(body.duration_seconds || 0),
        file_size_mb: Number(body.file_size_mb || 0),

        hook: clamp01to10(body.hook, 5),
        trend_match: clamp01to10(body.trend_match, 5),
        beat_sync: clamp01to10(body.beat_sync, 5),
        visual_clarity: clamp01to10(body.visual_clarity, 5),
        face_presence: clamp01to10(body.face_presence, 5),
        caption_strength: clamp01to10(body.caption_strength, 5),
        originality: clamp01to10(body.originality, 5),
        replay_value: clamp01to10(body.replay_value, 5),
        simplicity: clamp01to10(body.simplicity, 5),

        algorithm_chance: clamp01to100(body.algorithm_chance, 50),
        like_potential: clamp01to100(body.like_potential, 50),
        view_potential: clamp01to100(body.view_potential, 50),

        verdict: body.verdict || "Без вердикта",
        matched_ideas: Array.isArray(body.matched_ideas) ? body.matched_ideas : [],
      };

      const { data, error } = await adminClient
        .from("video_analyses")
        .insert(payload)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: `Ошибка Supabase: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Анализ сохранён.",
        data,
      });
    }

    return NextResponse.json(
      { error: "Неизвестное действие." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при работе с анализами." },
      { status: 500 }
    );
  }
}