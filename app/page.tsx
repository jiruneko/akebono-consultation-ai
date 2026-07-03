"use client";

import { useState } from "react";

type ConsultationCategory =
  | "相続"
  | "労務"
  | "契約トラブル"
  | "離婚"
  | "債務整理"
  | "会社設立"
  | "その他";

type Urgency = "低" | "中" | "高";

type ProfessionalType =
  | "弁護士"
  | "司法書士"
  | "行政書士"
  | "社労士"
  | "税理士"
  | "横断相談";

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

type CaseStatus = "ヒアリング中" | "士業確認待ち" | "受任候補" | "対応完了";

type CaseItem = {
  id: string;
  clientName: string;
  category: ConsultationCategory;
  urgency: Urgency;
  professionalType: ProfessionalType;
  status: CaseStatus;
  createdAt: string;
  summary: string;
  suggestedAction: string;
};

const categories: ConsultationCategory[] = [
  "相続",
  "労務",
  "契約トラブル",
  "離婚",
  "債務整理",
  "会社設立",
  "その他",
];

const urgencyLevels: Urgency[] = ["低", "中", "高"];

const professionalTypes: ProfessionalType[] = [
  "弁護士",
  "司法書士",
  "行政書士",
  "社労士",
  "税理士",
  "横断相談",
];

const caseStatuses: CaseStatus[] = [
  "ヒアリング中",
  "士業確認待ち",
  "受任候補",
  "対応完了",
];

const demoCases = {
  inheritance: {
    category: "相続" as ConsultationCategory,
    urgency: "中" as Urgency,
    professionalType: "司法書士" as ProfessionalType,
    text: "父が亡くなり、兄弟3人で相続の話をしています。実家の土地と建物、預金が少しありますが、長男が全部自分が管理すると言っていて、他の兄弟に詳しい資料を見せてくれません。母はすでに亡くなっています。何から確認すればよいかわかりません。",
  },
  labor: {
    category: "労務" as ConsultationCategory,
    urgency: "高" as Urgency,
    professionalType: "社労士" as ProfessionalType,
    text: "従業員から、残業代が未払いだと言われました。本人は毎日2時間ほど残業していたと言っています。会社としては明確な残業指示を出したつもりはありません。タイムカードはありますが、業務時間の実態までは把握できていません。",
  },
  contract: {
    category: "契約トラブル" as ConsultationCategory,
    urgency: "中" as Urgency,
    professionalType: "弁護士" as ProfessionalType,
    text: "Web制作を外部業者に依頼しましたが、納期を過ぎても完成しません。すでに着手金として30万円を支払っています。契約書はありますが、納期遅延時の対応については詳しく書かれていません。返金や損害賠償を請求できるのか知りたいです。",
  },
};

function formatDateTime() {
  return new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createCaseId(count: number) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const serial = String(count + 1).padStart(3, "0");

  return `AKB-${yyyy}${mm}${dd}-${serial}`;
}

export default function Home() {
  const [clientName, setClientName] = useState("山田 太郎");
  const [category, setCategory] = useState<ConsultationCategory>("相続");
  const [urgency, setUrgency] = useState<Urgency>("中");
  const [professionalType, setProfessionalType] =
    useState<ProfessionalType>("司法書士");
  const [consultationText, setConsultationText] = useState("");
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [createdAt, setCreatedAt] = useState("");

  const currentCaseId = createCaseId(cases.length);

  const handleDemoCase = (type: "inheritance" | "labor" | "contract") => {
    const demo = demoCases[type];

    setClientName("山田 太郎");
    setCategory(demo.category);
    setUrgency(demo.urgency);
    setProfessionalType(demo.professionalType);
    setConsultationText(demo.text);
    setResult(null);
    setCreatedAt("");
  };

  const handleSubmit = async () => {
    if (!consultationText.trim()) {
      alert("相談内容を入力してください。");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCreatedAt(formatDateTime());

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          category,
          urgency,
          professionalType,
          consultationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "APIリクエストに失敗しました。");
      }

      if (!data.result) {
        throw new Error("APIから整理結果が返ってきませんでした。");
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "相談内容の整理中にエラーが発生しました。";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCreateCase = () => {
    if (!result) {
      alert("先にAI整理を実行してください。");
      return;
    }

    const newCase: CaseItem = {
      id: currentCaseId,
      clientName,
      category,
      urgency,
      professionalType,
      status: "士業確認待ち",
      createdAt: formatDateTime(),
      summary: result.summary,
      suggestedAction: result.suggestedAction,
    };

    setCases([newCase, ...cases]);
    alert("案件化しました。画面下部の案件一覧に追加されました。");
  };

  const handleChangeCaseStatus = (id: string, status: CaseStatus) => {
    setCases(
      cases.map((caseItem) =>
        caseItem.id === id ? { ...caseItem, status } : caseItem
      )
    );
  };

  const handleDeleteCase = (id: string) => {
    const ok = confirm("この案件を一覧から削除しますか？");

    if (!ok) {
      return;
    }

    setCases(cases.filter((caseItem) => caseItem.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="no-print rounded-3xl bg-white px-8 py-7 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-blue-700">
                Akebono Legal Consultation AI
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                士業相談内容整理AI
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                相談者から届いた文章を、士業が確認しやすい形に自動整理します。
                初回相談前のヒアリング、論点整理、必要書類確認、案件共有の前処理を支援します。
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm">
              <p className="font-semibold text-slate-700">デモ案件ID</p>
              <p className="mt-1 font-mono text-blue-700">{currentCaseId}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="no-print space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">相談入力</h2>
              <p className="mt-1 text-sm text-slate-500">
                営業デモでは、下のデモ相談文を使うとスムーズです。
              </p>

              <div className="mt-5 grid gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-semibold">相談者名</span>
                  <input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">相談カテゴリ</span>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as ConsultationCategory)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">緊急度</span>
                  <select
                    value={urgency}
                    onChange={(event) =>
                      setUrgency(event.target.value as Urgency)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {urgencyLevels.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">担当候補士業</span>
                  <select
                    value={professionalType}
                    onChange={(event) =>
                      setProfessionalType(event.target.value as ProfessionalType)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {professionalTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">相談内容</span>
                  <textarea
                    value={consultationText}
                    onChange={(event) =>
                      setConsultationText(event.target.value)
                    }
                    className="min-h-[220px] w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="相談者から届いた内容を貼り付けてください。"
                  />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoCase("inheritance")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  相続相談デモ
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoCase("labor")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  労務相談デモ
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoCase("contract")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  契約トラブルデモ
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? "相談内容を整理中です…" : "AIで相談内容を整理する"}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">案件ステータス</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">案件ID</span>
                  <span className="font-mono font-semibold">
                    {currentCaseId}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">カテゴリ</span>
                  <span className="font-semibold">{category}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">緊急度</span>
                  <span className="font-semibold">{urgency}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">担当候補</span>
                  <span className="font-semibold">{professionalType}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">ステータス</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    ヒアリング中
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <section
            id="print-area"
            className="rounded-3xl bg-white p-6 shadow-sm print:shadow-none"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  Akebono Legal Consultation AI
                </p>
                <h2 className="mt-1 text-xl font-bold">相談整理レポート</h2>
                <p className="mt-1 text-sm text-slate-500">
                  士業への引き継ぎを想定した整理結果です。
                </p>
              </div>

              <div className="no-print flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  disabled={!result}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  PDF出力
                </button>

                <button
                  type="button"
                  onClick={handleCreateCase}
                  disabled={!result}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  案件化
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm md:grid-cols-2">
              <div>
                <span className="text-slate-500">案件ID：</span>
                <span className="font-mono font-semibold">{currentCaseId}</span>
              </div>

              <div>
                <span className="text-slate-500">作成日時：</span>
                <span className="font-semibold">{createdAt || "未作成"}</span>
              </div>

              <div>
                <span className="text-slate-500">相談者名：</span>
                <span className="font-semibold">{clientName}</span>
              </div>

              <div>
                <span className="text-slate-500">相談カテゴリ：</span>
                <span className="font-semibold">{category}</span>
              </div>

              <div>
                <span className="text-slate-500">緊急度：</span>
                <span className="font-semibold">{urgency}</span>
              </div>

              <div>
                <span className="text-slate-500">担当候補士業：</span>
                <span className="font-semibold">{professionalType}</span>
              </div>
            </div>

            {!result && !isLoading && (
              <div className="no-print mt-6 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-700">
                    まだ整理結果はありません
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    左側に相談内容を入力して、
                    <br />
                    「AIで相談内容を整理する」を押してください。
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="no-print mt-6 flex min-h-[420px] items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
                <div>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-700" />
                  <p className="mt-5 text-lg font-bold text-slate-700">
                    相談内容を整理中です
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    要約、論点、確認質問、必要書類を生成しています。
                  </p>
                </div>
              </div>
            )}

            {result && !isLoading && (
              <div className="mt-6 grid gap-4">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">相談要約</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {result.summary}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">状況整理</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {result.situation}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">主な論点</h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                    {result.issues.map((item, index) => (
                      <li key={`issue-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">確認質問</h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                    {result.questions.map((item, index) => (
                      <li key={`question-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">必要書類</h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
                    {result.requiredDocuments.map((item, index) => (
                      <li key={`document-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">
                    士業向けメモ
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {result.professionalMemo}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">
                    Akebono内部メモ
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {result.internalMemo}
                  </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-blue-700">
                    次の推奨アクション
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {result.suggestedAction}
                  </p>
                </section>

                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-sm font-bold text-amber-800">
                    注意事項
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-amber-900">
                    本レポートは、相談内容を士業が確認しやすくするための補助資料です。
                    法的判断や最終的な助言は、必ず資格を持つ専門家が確認してください。
                  </p>
                </section>
              </div>
            )}
          </section>
        </section>

        <section className="no-print rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Case Management
              </p>
              <h2 className="mt-1 text-xl font-bold">案件一覧</h2>
              <p className="mt-2 text-sm text-slate-500">
                「案件化」した相談がここに追加されます。現時点では営業デモ用の一時保存です。
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              登録案件数：{cases.length}件
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-bold text-slate-700">
                まだ案件化された相談はありません
              </p>
              <p className="mt-2 text-sm text-slate-500">
                AI整理結果の右上にある「案件化」ボタンを押すと、ここに案件カードが追加されます。
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {cases.map((caseItem) => (
                <article
                  key={caseItem.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-bold text-blue-700">
                          {caseItem.id}
                        </p>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {caseItem.category}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          緊急度：{caseItem.urgency}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {caseItem.professionalType}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold">
                        {caseItem.clientName} 様の相談
                      </h3>

                      <p className="mt-2 text-xs text-slate-500">
                        作成日時：{caseItem.createdAt}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={caseItem.status}
                        onChange={(event) =>
                          handleChangeCaseStatus(
                            caseItem.id,
                            event.target.value as CaseStatus
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {caseStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-700">
                        相談要約
                      </h4>
                      <p className="mt-2 max-h-32 overflow-hidden whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {caseItem.summary}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-700">
                        次の推奨アクション
                      </h4>
                      <p className="mt-2 max-h-32 overflow-hidden whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {caseItem.suggestedAction}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}