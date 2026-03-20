import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) return null;

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

function buildTrendPayload(body) {
  return {
    category: body.category,
    title: body.title?.trim() || "",
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
  };
}

function validateTrendBody(body) {
  const allowedCategories = ["Танцы", "Пение", "Липсинги"];
  const allowedStatuses = ["hot", "rising", "avoid"];

  if (!body.title || !body.title.trim()) {
    return 'Поле "Название тренда" обязательно.';
  }

  if (!allowedCategories.includes(body.category)) {
    return "Неверная категория.";
  }

  if (!allowedStatuses.includes(body.trend_status)) {
    return "Неверный статус тренда.";
  }

  return null;
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

    const validationError = validateTrendBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = {
      ...buildTrendPayload(body),
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
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при добавлении тренда." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
        { error: "Не передан id тренда для редактирования." },
        { status: 400 }
      );
    }

    const validationError = validateTrendBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = buildTrendPayload(body);

    const { data, error } = await adminClient
      .from("trends")
      .update(payload)
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
      message: "Тренд успешно обновлён.",
      data,
    });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при редактировании тренда." },
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

    const nextActiveState =
      typeof body.is_active === "boolean" ? body.is_active : false;

    const { data, error } = await adminClient
      .from("trends")
      .update({ is_active: nextActiveState })
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
      message: nextActiveState ? "Тренд восстановлен." : "Тренд отключён.",
      data,
    });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при изменении статуса тренда." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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
        { error: "Не передан id тренда для удаления." },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from("trends")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json(
        { error: `Ошибка Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Тренд удалён.",
    });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при удалении тренда." },
      { status: 500 }
    );
  }
}