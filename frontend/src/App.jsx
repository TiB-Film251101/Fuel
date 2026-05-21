import { useState, useEffect, useRef } from "react";
import { recommend } from "./lib/api.js";
import { storage } from "./lib/storage.js";

const HI = "'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif";
const HE = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const BG = "#FAFAF8", WHITE = "#fff", INK = "#0F0F0F", PALE = "#999", LINE = "#E2E2E0", LINE2 = "#CACAC8";

const GENRES = ["国内文芸", "翻訳文芸", "哲学・評論", "詩・短歌・俳句", "映画"];
const SETTINGS_DEBOUNCE = 500;

function amazonUrl(title, author) {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(`${title} ${author}`)}`;
}

function AmazonLink({ title, author }) {
  return (
    <a
      href={amazonUrl(title, author)}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block", fontSize: 11, color: PALE, fontFamily: HE,
        letterSpacing: "0.04em", textDecoration: "none", padding: "7px 16px",
        borderTop: `1px solid ${LINE}`, background: "#F5F5F3",
        borderRadius: "0 0 4px 4px",
      }}
    >
      ⚺ Amazon で見る
    </a>
  );
}

export default function App() {
  const [settings, setSettings] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [signals, setSignals] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [toast, setToast] = useState(null);
  const settingsTimer = useRef(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    setSettings(storage.get("settings") || "");
    setSelectedGenres(storage.getJSON("genres", []));
    setBookmarks(storage.getJSON("bookmarks", []));
    setSignals(storage.getJSON("signals", []));
  }, []);

  useEffect(() => {
    if (!loading && recommendations.length > 0) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const handleSettingsChange = (val) => {
    setSettings(val);
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => storage.set("settings", val), SETTINGS_DEBOUNCE);
  };

  const toggleGenre = (genre) => {
    const next = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(next);
    storage.setJSON("genres", next);
  };

  const showToast = (message) => {
    const key = Date.now();
    setToast({ message, key });
    setTimeout(() => setToast((t) => (t?.key === key ? null : t)), 1500);
  };

  const handleRecommend = async () => {
    textareaRef.current?.blur();
    setLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const data = await recommend({ n: 5, settings, genres: selectedGenres, signals, excludeList: [] });
      setRecommendations(data);
    } catch {
      setError("取得に失敗しました。再試行してください。");
    }
    setLoading(false);
  };

  const handleMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const excludeList = recommendations.map(({ title, author }) => ({ title, author }));
      const data = await recommend({ n: 5, settings, genres: selectedGenres, signals, excludeList });
      setRecommendations((prev) => [...prev, ...data]);
    } catch {
      setError("取得に失敗しました。再試行してください。");
    }
    setLoadingMore(false);
  };

  const handleBookmark = (card) => {
    const entry = {
      id: String(Date.now()),
      title: card.title,
      author: card.author,
      publisher: card.publisher,
      reason: card.reason,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...bookmarks];
    setBookmarks(next);
    storage.setJSON("bookmarks", next);
    showToast("ブックメモに追加しました");
  };

  const handleSignal = (card) => {
    const entry = { genre: card.genre, theme: card.theme, savedAt: new Date().toISOString() };
    const next = [entry, ...signals].slice(0, 10);
    setSignals(next);
    storage.setJSON("signals", next);
    showToast("次回の推薦に反映されます");
  };

  const handleDeleteBookmark = (id) => {
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    storage.setJSON("bookmarks", next);
  };

  const canRecommend = selectedGenres.length > 0 && !loading;

  const ghost = {
    fontFamily: HI, cursor: "pointer", fontSize: 12, padding: "6px 13px",
    background: "transparent", color: INK, border: `1px solid ${LINE2}`, borderRadius: 4,
  };
  const primaryBtn = (off) => ({
    fontFamily: HE, cursor: off ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 800,
    letterSpacing: "0.1em", padding: "10px 22px",
    background: off ? LINE : INK, color: off ? PALE : WHITE, border: "none", borderRadius: 4,
  });

  return (
    <div style={{ fontFamily: HI, background: BG, minHeight: "100vh", padding: "16px 14px", boxSizing: "border-box", color: INK, maxWidth: 640, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: INK, color: WHITE, fontFamily: HI, fontSize: 12,
          padding: "8px 16px", borderRadius: 4, zIndex: 100, whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: HE, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Fuel</span>
      </div>

      {/* Settings BOX */}
      <div style={{ marginBottom: 14 }}>
        <textarea
          ref={textareaRef}
          style={{
            fontFamily: HI, fontSize: 14, color: INK, lineHeight: 1.9, background: WHITE,
            border: `1px solid ${LINE2}`, borderRadius: 4, padding: "10px 14px",
            boxSizing: "border-box", outline: "none", width: "100%", minHeight: 80, resize: "vertical",
          }}
          value={settings}
          onChange={(e) => handleSettingsChange(e.target.value)}
          placeholder="好きな作家、好きなジャンル傾向、避けたい要素、いま気になっていること…"
        />
      </div>

      {/* Genre filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {GENRES.map((g) => {
          const sel = selectedGenres.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              style={{
                fontFamily: HI, fontSize: 12, padding: "5px 14px", borderRadius: 20,
                cursor: "pointer", border: `1px solid ${sel ? INK : LINE2}`,
                background: sel ? INK : "transparent", color: sel ? WHITE : INK,
              }}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Search button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <button style={primaryBtn(!canRecommend)} onClick={handleRecommend} disabled={!canRecommend}>
          探す
        </button>
        {selectedGenres.length === 0 && (
          <span style={{ fontSize: 11, color: PALE, fontFamily: HI }}>ジャンルを1つ以上選んでください</span>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #DC2626", borderRadius: 4,
          padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, color: "#7F1D1D" }}>{error}</span>
          <button style={{ ...ghost, fontSize: 11, padding: "4px 10px" }} onClick={handleRecommend}>再試行</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <svg width="120" height="60" viewBox="0 0 120 60" style={{ display: "block", margin: "0 auto 12px" }}>
            <path d="M0,30 C30,0 90,60 120,30" stroke="#666" fill="none" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="d" dur="2.4s" repeatCount="indefinite"
                values="M0,30 C30,0 90,60 120,30;M0,30 C30,60 90,0 120,30;M0,30 C30,0 90,60 120,30" />
            </path>
            <path d="M0,30 C30,10 90,50 120,30" stroke="#999" fill="none" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="d" dur="3s" repeatCount="indefinite"
                values="M0,30 C30,10 90,50 120,30;M0,30 C30,50 90,10 120,30;M0,30 C30,10 90,50 120,30" />
            </path>
            <path d="M0,30 C30,18 90,42 120,30" stroke="#bbb" fill="none" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="d" dur="3.6s" repeatCount="indefinite"
                values="M0,30 C30,18 90,42 120,30;M0,30 C30,42 90,18 120,30;M0,30 C30,18 90,42 120,30" />
            </path>
          </svg>
          <div style={{ fontFamily: HE, fontSize: 9, letterSpacing: "0.2em", color: PALE, textTransform: "uppercase" }}>
            Finding books
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && !loading && (
        <div ref={resultRef}>
          {recommendations.map((card, i) => (
            <div key={i} style={{
              background: WHITE, border: `1px solid ${LINE2}`, borderRadius: 4,
              marginBottom: 12, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 16px 12px" }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: PALE }}>
                    {card.author}{card.publisher && <span>　{card.publisher}</span>}
                  </div>
                </div>
                {card.reason && (
                  <p style={{ fontSize: 13, color: INK, lineHeight: 1.7, margin: "0 0 12px" }}>{card.reason}</p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={ghost} onClick={() => handleBookmark(card)}>読みたい</button>
                  <button style={ghost} onClick={() => handleSignal(card)}>もっとこういうの</button>
                </div>
              </div>
              <AmazonLink title={card.title} author={card.author} />
            </div>
          ))}

          {/* More button */}
          <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
            {loadingMore
              ? <span style={{ fontSize: 12, color: PALE }}>取得中…</span>
              : <button style={ghost} onClick={handleMore}>もう少し見たい</button>
            }
          </div>
        </div>
      )}

      {/* Book memo */}
      <div style={{ borderTop: `1px solid ${LINE}`, marginTop: recommendations.length > 0 ? 0 : 8 }}>
        <button
          onClick={() => setShowBookmarks((v) => !v)}
          style={{
            fontFamily: HI, background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: PALE, padding: "14px 0", width: "100%", textAlign: "left",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span>ブックメモ（{bookmarks.length}冊）</span>
          <span style={{ fontSize: 10 }}>{showBookmarks ? "▲" : "▼"}</span>
        </button>
        {showBookmarks && (
          <div style={{ paddingBottom: 24 }}>
            {bookmarks.length === 0
              ? <div style={{ fontSize: 12, color: PALE, padding: "4px 0 12px" }}>まだ追加されていません</div>
              : bookmarks.map((b) => (
                <div key={b.id} style={{
                  border: `1px solid ${LINE2}`, borderRadius: 4, marginBottom: 8, overflow: "hidden",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: PALE, marginBottom: 4 }}>
                        {b.author}{b.publisher && `　${b.publisher}`}
                      </div>
                      {b.reason && <p style={{ fontSize: 12, color: PALE, margin: 0, lineHeight: 1.6 }}>{b.reason}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteBookmark(b.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: PALE, flexShrink: 0, padding: "0 4px" }}
                    >×</button>
                  </div>
                  <AmazonLink title={b.title} author={b.author} />
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
