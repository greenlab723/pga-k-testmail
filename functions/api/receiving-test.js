export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.GAS_WEBAPP_URL) {
      return json({ ok: false, message: 'サーバ設定エラー：GAS_WEBAPP_URL が未設定です。' }, 500);
    }

    const body = await request.json().catch(() => null);
    const email = body && typeof body.email === 'string' ? body.email.trim() : '';
    const ua = body && typeof body.ua === 'string' ? body.ua : '';
    const page = body && typeof body.page === 'string' ? body.page : '';

    if (!email) {
      return json({ ok: false, message: 'メールアドレスを入力してください。' }, 400);
    }

    const payload = {
      email,
      ua,
      page,
      apiKey: env.RECEIVING_TEST_API_KEY || ''
    };

    const resp = await fetch(env.GAS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json({ ok: false, message: data && data.message ? data.message : 'GAS呼び出しに失敗しました。' }, 502);
    }
    return json(data, 200);
  } catch (e) {
    return json({ ok: false, message: 'サーバエラー：' + (e && e.message ? e.message : String(e)) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
