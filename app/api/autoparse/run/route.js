import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const CREATIVE_CENTER_HASHTAGS_URL =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en";

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

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function parseCountTextToNumber(value = "") {
  const text = cleanText(value).toUpperCase();
  const match = text.match(/(\d+(?:\.\d+)?)([KMB])?/);

  if (!match) return 0;

  const num = Number(match[1]);
  const suffix = match[2];

  if (suffix === "K") return Math.round(num * 1000);
  if (suffix === "M") return Math.round(num * 1000000);
  if (suffix === "B") return Math.round(num * 1000000000);

  return Math.round(num);
}

function detectCategory(title) {
  const t = title.toLowerCase();

  if (
    /dance|dancer|choreo|choreography|move|outfit|transition|shuffle|groove/.test(
      t
    )
  ) {
    return "Танцы";
  }

  if (/sing|singer|vocal|cover|karaoke|acapella|song/.test(t)) {
    return "Пение";
  }

  if (/lip|lipsync|dialog|dialogue|meme|reaction|skit|voice|acting/.test(t)) {
    return "Липсинги";
  }

  return "Липсинги";
}

function estimateTrendStatus(rank) {
  if (rank <= 10) return "hot";
  if (rank <= 30) return "rising";
  return "avoid";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildTrendMetrics(rank, postsCount, title) {
  const category = detectCategory(title);

  const baseVelocity = clamp(100 - rank * 2, 40, 95);
  const sizeBoost =
    postsCount > 1000000 ? 10 : postsCount > 100000 ? 6 : postsCount > 10000 ? 3 : 0;

  const velocity = clamp(baseVelocity + sizeBoost, 35, 98);
  const engagement = clamp(70 + sizeBoost - Math.floor(rank / 5), 45, 90);
  const repeatability =
    category === "Танцы"
      ? 78
      : category === "Пение"
      ? 70
      : 85;

  const saturation = clamp(rank <= 5 ? 78 : rank <= 15 ? 62 : 45, 25, 85);
  const complexity =
    category === "Танцы"
      ? 34
      : category === "Пение"
      ? 42
      : 22;

  const faceFit = category === "Пение" ? 88 : 84;
  const risk = rank <= 10 ? 28 : 18;

  return {
    velocity,
    engagement,
    repeatability,
    saturation,
    complexity,
    face_fit: faceFit,
    risk,
    category,
    trend_status: estimateTrendStatus(rank),
  };
}

function extractHashtagRowsFromRenderedText(text) {
  const cleaned = cleanText(text);
  const rows = [];
  const seen = new Set();

  const regex =
    /(\d{1,3})\s+(?:\d+\s+)?#\s*([^\s#]+)(?:.*?)(\d+(?:\.\d+)?[KMB]?)\s+Posts/gi;

  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    const rank = Number(match[1]);
    const hashtag = `#${match[2]}`;
    const postsCountText = `${match[3]} Posts`;
    const key = hashtag.toLowerCase();

    if (!rank || !hashtag) continue;
    if (seen.has(key)) continue;

    seen.add(key);

    rows.push({
      rank_position: rank,
      title: hashtag,
      posts_count_text: postsCountText,
      external_id: key,
      source_url: CREATIVE_CENTER_HASHTAGS_URL,
      raw_payload: {
        source_text: match[0],
      },
    });
  }

  return rows
    .sort((a, b) => a.rank_position - b.rank_position)
    .slice(0, 20);
}

async function createOrUpdateTrend(adminClient, item, region) {
  const postsCount = parseCountTextToNumber(item.posts_count_text);
  const metrics = buildTrendMetrics(item.rank_position, postsCount, item.title);

  const existingResult = await adminClient
    .from("trends")
    .select("id")
    .eq("title", item.title)
    .eq("region", region)
    .eq("source_type", "autoparse_hashtag")
    .limit(1);

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  if (existingResult.data && existingResult.data.length > 0) {
    const existingId = existingResult.data[0].id;

    const { data, error } = await adminClient
      .from("trends")
      .update({
        category: metrics.category,
        audio: "Auto-detected from Creative Center hashtag page",
        velocity: metrics.velocity,
        engagement: metrics.engagement,
        repeatability: metrics.repeatability,
        saturation: metrics.saturation,
        complexity: metrics.complexity,
        face_fit: metrics.face_fit,
        risk: metrics.risk,
        note: "Автопарсинг из TikTok Creative Center. Требует ручной проверки и редактирования под нишу.",
        source_url: item.source_url,
        source_type: "autoparse_hashtag",
        trend_status: metrics.trend_status,
        is_active: true,
      })
      .eq("id", existingId)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await adminClient
    .from("trends")
    .insert({
      category: metrics.category,
      title: item.title,
      audio: "Auto-detected from Creative Center hashtag page",
      region,
      velocity: metrics.velocity,
      engagement: metrics.engagement,
      repeatability: metrics.repeatability,
      saturation: metrics.saturation,
      complexity: metrics.complexity,
      face_fit: metrics.face_fit,
      risk: metrics.risk,
      note: "Автопарсинг из TikTok Creative Center. Требует ручной проверки и редактирования под нишу.",
      source_url: item.source_url,
      source_type: "autoparse_hashtag",
      trend_status: metrics.trend_status,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function POST(request) {
  let runId = null;
  let browser = null;

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

    const region = body.region || "GLOBAL";

    const runInsert = await adminClient
      .from("trend_fetch_runs")
      .insert({
        source: "creative_center_hashtags_public",
        region,
        source_type: "creative_center",
        status: "running",
      })
      .select()
      .single();

    if (runInsert.error) {
      return NextResponse.json(
        { error: `Не удалось создать fetch run: ${runInsert.error.message}` },
        { status: 500 }
      );
    }

    runId = runInsert.data.id;

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    });

    await page.goto(CREATIVE_CENTER_HASHTAGS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    await page.waitForTimeout(7000);

    const pageText = await page.locator("body").innerText();
    const items = extractHashtagRowsFromRenderedText(pageText);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Не удалось извлечь хэштеги из уже отрендеренной страницы.",
          debug: {
            text_preview: pageText.slice(0, 1500),
            text_length: pageText.length,
          },
        },
        { status: 500 }
      );
    }

    let rawSaved = 0;
    let trendsUpserted = 0;

    for (const item of items) {
      let rawItemId = null;

      const existingRaw = await adminClient
        .from("trend_raw_items")
        .select("id")
        .eq("source", "creative_center_hashtags_public")
        .eq("entity_type", "hashtag")
        .eq("region", region)
        .eq("external_id", item.external_id)
        .limit(1);

      if (existingRaw.error) {
        throw new Error(existingRaw.error.message);
      }

      if (existingRaw.data && existingRaw.data.length > 0) {
        rawItemId = existingRaw.data[0].id;

        const { error } = await adminClient
          .from("trend_raw_items")
          .update({
            run_id: runId,
            rank_position: item.rank_position,
            posts_count_text: item.posts_count_text,
            source_url: item.source_url,
            raw_payload: item.raw_payload,
            fetched_at: new Date().toISOString(),
          })
          .eq("id", rawItemId);

        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await adminClient
          .from("trend_raw_items")
          .insert({
            run_id: runId,
            source: "creative_center_hashtags_public",
            entity_type: "hashtag",
            region,
            external_id: item.external_id,
            rank_position: item.rank_position,
            title: item.title,
            source_url: item.source_url,
            posts_count_text: item.posts_count_text,
            raw_payload: item.raw_payload,
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        rawItemId = data.id;
      }

      rawSaved += 1;

      const trend = await createOrUpdateTrend(adminClient, item, region);

      const { error: rawUpdateError } = await adminClient
        .from("trend_raw_items")
        .update({
          normalized: true,
          normalized_trend_id: trend.id,
        })
        .eq("id", rawItemId);

      if (rawUpdateError) throw new Error(rawUpdateError.message);

      trendsUpserted += 1;
    }

    const { error: finishError } = await adminClient
      .from("trend_fetch_runs")
      .update({
        status: "success",
        items_fetched: rawSaved,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    if (finishError) {
      throw new Error(finishError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Автопарсинг выполнен.",
      run_id: runId,
      items_fetched: rawSaved,
      trends_upserted: trendsUpserted,
      sample_titles: items.slice(0, 5).map((item) => item.title),
    });
  } catch (error) {
    if (runId) {
      const adminClient = getAdminClient();

      if (adminClient) {
        await adminClient
          .from("trend_fetch_runs")
          .update({
            status: "error",
            error_message: error.message || "Unknown error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);
      }
    }

    return NextResponse.json(
      {
        error: error.message || "Ошибка сервера при автопарсинге.",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}