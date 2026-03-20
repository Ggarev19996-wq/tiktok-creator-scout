import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) return null;

  return createClient(url, secret);
}

async function readBodySafe(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
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

export async function DELETE(request, { params }) {
  try {
    const adminClient = getAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Не найдены переменные Supabase для сервера." },
        { status: 500 }
      );
    }

    const body = await readBodySafe(request);
    const passwordCheck = checkAdminPassword(body);

    if (!passwordCheck.ok) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 401 }
      );
    }

    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Не передан id анализа." },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from("video_analyses")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Ошибка Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Анализ удалён.",
    });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера при удалении анализа." },
      { status: 500 }
    );
  }
}