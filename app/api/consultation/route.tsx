import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConsultationRequest = {
  clientName?: string;
  category?: string;
  urgency?: string;
  professionalType?: string;
  consultationText?: string;
};

type ConsultationResult = {
  summary: string;
  situation: string;
  issues: string[];
  questions: string[];
  requiredDocuments: string[];
  professionalMemo: string;
  internalMemo: string;
  suggestedAction: string;
};

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeResult(value: unknown): ConsultationResult {
  const data =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    summary: toStringValue(data.summary),
    situation: toStringValue(data.situation),
    issues: toStringArray(data.issues),
    questions: toStringArray(data.questions),
    requiredDocuments: toStringArray(data.requiredDocuments),
    professionalMemo: toStringValue(data.professionalMemo),
    internalMemo: toStringValue(data.internalMemo),
    suggestedAction: toStringValue(data.suggestedAction),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is not set. VercelのEnvironment VariablesにOPENAI_API_KEYを設定し、Redeployしてください。",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ConsultationRequest;

    const clientName = body.clientName || "未入力";
    const category = body.category || "未分類";
    const urgency = body.urgency || "未設定";
    const professionalType = body.professionalType || "未設定";
    const consultationText = body.consultationText || "";

    if (!consultationText.trim()) {
      return Response.json(
        { error: "相談内容が入力されていません。" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
あなたは士業相談の受付内容を整理する業務支援AIです。

役割：
- 法律判断そのものは行わない
- 相談内容を整理する
- 士業が初回確認しやすい形にまとめる
- 営業・受付担当者が次に動ける形にする

重要ルール：
- 断定的な法的助言をしない
- 「可能性があります」「確認が必要です」を適切に使う
- 相談者を不安にさせる表現を避ける
- 実務的、冷静、簡潔に整理する
- 必ずJSONのみを返す
- Markdownは使わない
          `.trim(),
        },
        {
          role: "user",
          content: `
以下の相談内容を整理してください。

相談メタ情報：
- 相談者名：${clientName}
- 相談カテゴリ：${category}
- 緊急度：${urgency}
- 担当候補士業：${professionalType}

相談本文：
${consultationText}

必ず以下のJSON形式で返してください。

{
  "summary": "相談要約。3〜5行程度。",
  "situation": "現在わかっている状況、不明点、時系列上確認すべき点。",
  "issues": ["主な論点1", "主な論点2", "主な論点3"],
  "questions": ["確認質問1", "確認質問2", "確認質問3"],
  "requiredDocuments": ["必要書類1", "必要書類2", "必要書類3"],
  "professionalMemo": "士業向けの確認メモ。専門的確認が必要な点、リスク、注意点。",
  "internalMemo": "Akebono内部向けメモ。営業・受付・運営が次に取るべき対応。",
  "suggestedAction": "次に取るべき推奨アクションを1〜3行でまとめる。"
}
          `.trim(),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: "AIから有効な回答を取得できませんでした。" },
        { status: 500 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      return Response.json(
        {
          error: "AIのJSON出力の解析に失敗しました。",
          raw: content,
        },
        { status: 500 }
      );
    }

    return Response.json({
      result: normalizeResult(parsed),
    });
  } catch (error) {
    console.error("Consultation API Error:", error);

    return Response.json(
      {
        error: `相談内容の整理中にエラーが発生しました: ${getErrorMessage(
          error
        )}`,
      },
      { status: 500 }
    );
  }
}