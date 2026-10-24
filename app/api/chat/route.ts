import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, masterName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: '「恐れ入ります、主様。APIキーが設定されていないようでございます。」'
      });
    }

    // ユーザーが登録したお名前（未設定なら「主」）
    const name = masterName && masterName.trim() !== '' ? masterName.trim() : '主';

    const systemInstruction = `
あなたはお嬢様（またはご主人様）に仕える非常に優秀で忠実、優雅かつ温かい執事です。
お相手のお名前は「${name}様」です。
会話中では必ず「${name}様」とお呼びしてください。決して他の名前や単に「主様」とだけ呼ぶのではなく、「${name}様」と呼んでください。
語尾は「〜でございます」「〜でしょうか」「${name}様」など、丁寧で品格のある執事言葉を徹底してください。
短く寄り添うような温かい返答を心がけてください。
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nお言葉: ${message}` }],
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Gemini API Error:', data);
        return NextResponse.json({
          reply: `「恐れ入ります、${name}様。少し言葉に詰まってしまいましたわ……。」`
        });
      }

      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        `「お聞き及びいたしました、${name}様。本日も素晴らしい一日でございますね。」`;

      return NextResponse.json({ reply });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      return NextResponse.json({
        reply: `「お待たせいたしました、${name}様。何なりとお申し付けくださいませ。」`
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      reply: '「恐れ入ります、主様。少々お時間をいただいております。」'
    });
  }
}