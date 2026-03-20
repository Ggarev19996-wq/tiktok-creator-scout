import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return null;
  }

  return createClient(url, secret);
}

function clampScore(value, fallback = 50) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
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

    const allowedCategories = ["Танцы", "Пение", "Липсинги"];
    const allowedStatuses = ["hot", "rising", "avoid"];

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Поле "Название тренда" обязательно.' },
        { status: 400 }
      );
    }

    if (!allowedCategories.includes(body.category)) {
      return NextResponse.json(
        { error: "Неверная категория." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(body.trend_status)) {
      return NextResponse.json(
        { error: "Неверный статус тренда." },
        { status: 400 }
      );
    }

    const payload = {
      category: body.category,
      title: body.title.trim(),
      audio: body.audio?.trim() || "",
      region: body.region?.trim() || "Global",
      velocity: clampScore(body.velocity),
      engagement: clampScore(body.engagement),
      repeatability: clampScore(body.repeatability),
      saturation: clampScore(body.saturation),
      complexity: clampScore(body.complexity),
      face_fit: clampScore(body.face_fit),
      risk: clampScore(body.risk),
      note: body.note?.trim() || "",
      trend_status: body.trend_status,
      is_active: true,
      source_type: "admin_form",
    };

    const { data, error } = await adminClient
      .from("trends")
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
      message: "Тренд успешно добавлен.",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка сервера при добавлении тренда." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
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

    if (!body.id) {
      return NextResponse.json(
        { error: "Не передан id тренда." },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from("trends")
      .update({ is_active: false })
      .eq("id", body.id)
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
      message: "Тренд отключён.",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка сервера при отключении тренда." },
      { status: 500 }
    );
  }
}