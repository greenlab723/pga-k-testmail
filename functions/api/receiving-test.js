export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.GAS_WEBAPP_URL) {
      return json(
        { ok: false, message: "サーバ設定エラー：GAS_WEBAPP_URL が未設定です。" },
        500
      );
    }

    // --- body を安全に読む（JSON / x-www-form-urlencoded / multipart 対応）---
    // ★重要：Pages Functions では request.text() が空になるケースがあるため clone() して読む
    const body = await readBody_(request);

    // email は複数キーで拾う（事故耐性）
    const emailRaw =
      (typeof body.email === "string" && body.email) ||
      (typeof body.mail === "string" && body.mail) ||
      (typeof body.address === "string" && body.address) ||
      "";

    const email = String(emailRaw).trim();

    // ua / page は body 優先、無ければヘッダから補完
    const ua =
      (typeof body.ua === "string" && body.ua) ||
      request.headers.get("user-agent") ||
      "";

    const page =
      (typeof body.page === "string" && body.page) ||
      request.headers.get("referer") ||
      "";

    if (!email) {
      return json({ ok: false, message: "メールアドレスを入力してくださいませ。" }, 400);
    }

    const payload = {
      email,
      ua,
      page,
      apiKey: env.RECEIVING_TEST_API_KEY || "",
    };

    const resp = await fetch(env.GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return json(
        {
          ok: false,
          message: data && data.message ? data.message : "GAS呼び出しに失敗しました。",
        },
        502
      );
    }

    return json(data, 200);
  } catch (e) {
    return json(
      {
        ok: false,
        message: "サーバエラー：" + (e && e.message ? e.message : String(e)),
      },
      500
    );
  }
}

/**
 * Cloudflare Pages Functions で request.json() が失敗する/本文が空になるケースに備え、
 * content-type を見て clone() した request から text/URLSearchParams/formData で確実に取り出す。
 */
async function readBody_(request) {
  const ct = (request.headers.get("content-type") || "").toLowerCase();

  // multipart は clone して formData を読む
  if (ct.includes("multipart/form-data")) {
    const req2 = request.clone();
    const fd = await req2.formData().catch(() => null);
    if (!fd) return {};
    return Object.fromEntries(fd.entries());
  }

  // それ以外は clone() して text で吸ってから解釈する（これが一番堅い）
  const req2 = request.clone();
  const raw = await req2.text().catch(() => "");
  const text = typeof raw === "string" ? raw : "";

  if (ct.includes("application/json")) {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    try {
      return Object.fromEntries(new URLSearchParams(text));
    } catch {
      return {};
    }
  }

  // content-type が無い/未知でも「JSONっぽい」なら一応 parse を試す
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fallthrough
    }
  }

  return {};
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
