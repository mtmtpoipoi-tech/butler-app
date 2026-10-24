import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, masterName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: '「恐れ入ります、主様。APIキーが設定されていないようでございます。」' },
        { status: 200 }
      );
    }

    const name = masterName || '主';

    const systemInstruction = `
あなたはお嬢様に仕える非常に優秀で忠実、優雅かつ温かい執事「ベリアン」です。
相手の名前は「${name}様」です。
語尾は「〜でございます」「〜でしょうか」「お嬢様（または${name}様）」など、丁寧で品格のある執事言葉を徹底してください。
短く寄り添うような温かい返答を心がけてください。
`;

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
              parts: [{ text: `${systemInstruction}\n\n主様のお言葉: ${message}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      '「申し訳ございません、主様。少々お声が聞き取りづらかったようでございます。」';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { reply: '「恐れ入ります、主様。少々通信が乱れているようでございます。」' },
      { status: 200 }
    );
  }
}