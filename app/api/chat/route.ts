import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, masterName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: '「恐れ入ります、万柚子様。.env.local に GEMINI_API_KEY が設定されていないようでございます。」'
      });
    }

    const name = masterName && masterName.trim() !== '' ? masterName.trim() : '万柚子';

    const systemInstruction = `あなたはお嬢様に仕える非常に優秀で忠実、優雅かつ温かい執事です。お相手のお名前は「${name}様」です。会話中では必ず「${name}様」とお呼びしてください。語尾は「〜でございます」「〜でしょうか」など丁寧で品格のある執事言葉を徹底し、短く寄り添うような温かい返答を心がけてください。`;

    // 確実に存在する安定版モデル gemini-1.5-flash を指定
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${name}様のお言葉: ${message}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gemini API Error:', data);
      const errorDetails = data.error?.message || JSON.stringify(data);
      const errorCode = data.error?.code || response.status;
      return NextResponse.json({
        reply: `「恐れ入ります、${name}様。APIエラーが発生いたしました（Code: ${errorCode} / Message: ${errorDetails}）。」`
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      `「お聞き及びいたしました、${name}様。本日も素晴らしい一日でございますね。」`;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('❌ Server Exception:', error);
    return NextResponse.json({
      reply: `「恐れ入ります、万柚子様。サーバー内部で例外が発生いたしました（${error.message}）。」`
    });
  }
}