import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, masterName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const name = masterName && masterName.trim() !== '' ? masterName.trim() : '万柚子';

    if (!apiKey) {
      return NextResponse.json({
        reply: `「恐れ入ります、${name}様。APIキーが設定されていないようでございますが、お言葉はしかと承りました。」`
      });
    }

    // 1. まずGemini API（gemini-2.0-flash）への接続を試みます
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: `あなたはお嬢様に仕える非常に優秀で忠実、優雅かつ温かい執事です。お相手のお名前は「${name}様」です。会話中では必ず「${name}様」とお呼びしてください。語尾は「〜でございます」「〜でしょうか」など丁寧で品格のある執事言葉を徹底し、短く（2〜3文程度で）寄り添うような温かい返答を心がけてください。` }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: message }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await response.json();
      
      // APIから正常に応答が得られた場合
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return NextResponse.json({ reply: data.candidates[0].content.parts[0].text });
      }
    } catch (apiError) {
      console.log('Network restriction or high demand detected, switching to butler fallback.');
    }

    // 2. 学校のネットワーク制限や混雑（503等）でAPIがつながらない場合の、執事のスマートな自動返答
    const fallbackReplies = [
      `「お聞き及びいたしました、${name}様。本日はネットワークの障壁が少々厚いようでございますが、${name}様のお言葉は私の心にしっかりと刻まれました。」`,
      `「さすがは${name}様でいらっしゃいますね。お茶の香りとともに、そのお言葉を深く味わわせていただきます。」`,
      `「ふふ、${name}様のお話はいつ伺っても心が和みます。本日はどのようなご予定でございますか？」`,
      `「かしこまりました、${name}様。お疲れの際は、どうか温かいお茶でも召し上がって一息ついてくださいませ。」`,
      `「お声がけいただき光栄です、${name}様。今日も素晴らしい一日になりますよう、お傍でお支えいたします。」`
    ];

    // ランダムに優雅な返答を選択
    const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

    return NextResponse.json({ reply: randomReply });

  } catch (error: any) {
    return NextResponse.json({
      reply: `「恐れ入ります、万柚子様。本日も素晴らしい一日になりますよう、お祈り申し上げます。」`
    });
  }
}