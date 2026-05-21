const TEMPLATE = `あなたは執筆者向けに書籍を推薦するエージェント。
以下の情報をもとに、{{N}}冊の本を推薦する。

【書き手の設定】
{{SETTINGS_BOX}}

【今回のジャンル指定】
{{GENRES}}

【過去に「もっとこういうの」と反応した方向(直近)】
{{SIGNALS}}

【除外する書名(既に提示済み)】
{{EXCLUDE_LIST}}

【推薦のルール】
- 実在する本であること。自信のない書名は出さないこと
- {{N}}冊すべて違う著者・違う方向性で出すこと
- 「設定」と「もっとこういうの」の両方を読み、書き手の現在地に効く本を選ぶこと
- 推薦理由は「なぜこの本がいま効くか」を1〜2文で具体的に書くこと
- 安全な名作だけでなく、書き手の知らない可能性のある本も1〜2冊混ぜること
- 「映画」ジャンルを指定された場合は、映画関連書籍(評論・脚本論・映画史・監督論・シネエッセイ等)を出すこと

【出力形式】
以下の JSON のみを返すこと。説明文・前置き・コードフェンス禁止。

{
  "recommendations": [
    {
      "title": "書名",
      "author": "著者",
      "publisher": "出版社",
      "reason": "1〜2文の推薦理由",
      "genre": "5ジャンルのいずれか",
      "theme": "20字程度の主題ラベル"
    }
  ]
}`;

export function buildPrompt({ n, settings, genres, signals, excludeList }) {
  const settingsText = settings?.trim() || "（なし）";
  const genresText = genres.length > 0 ? genres.join("、") : "指定なし";
  const signalsText = signals.length > 0
    ? signals.slice(0, 5).map((s) => `- ${s.genre}：${s.theme}`).join("\n")
    : "履歴なし";
  const excludeText = excludeList.length > 0
    ? excludeList.map((b) => `- 『${b.title}』（${b.author}）`).join("\n")
    : "なし";

  return TEMPLATE
    .replace(/\{\{N\}\}/g, String(n))
    .replace("{{SETTINGS_BOX}}", settingsText)
    .replace("{{GENRES}}", genresText)
    .replace("{{SIGNALS}}", signalsText)
    .replace("{{EXCLUDE_LIST}}", excludeText);
}
