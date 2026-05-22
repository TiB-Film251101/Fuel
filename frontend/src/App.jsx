import { useState, useEffect, useRef } from "react";
import { recommend } from "./lib/api.js";
import { storage } from "./lib/storage.js";

const HI = "'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif";
const HE = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const BG = "#FAFAF8", WHITE = "#fff", INK = "#0F0F0F", PALE = "#999", LINE = "#E2E2E0", LINE2 = "#CACAC8";

const GENRES = ["国内文芸", "翻訳文芸", "哲学・評論", "詩・短歌・俳句", "映画"];
const SETTINGS_DEBOUNCE = 500;
const TABS = [
  { id: "search", label: "探す" },
  { id: "wantToRead", label: "読みたい" },
  { id: "readBooks", label: "読んだ" },
];

function amazonUrl(title, author) {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(`${title} ${author}`)}`;
}

function AmazonLink({ title, author }) {
  return (
    <a href={amazonUrl(title, author)} target="_blank" rel="noopener noreferrer"
      style={{
        display: "block", fontSize: 11, color: PALE, fontFamily: HE,
        letterSpacing: "0.04em", textDecoration: "none", padding: "7px 16px",
        borderTop: `1px solid ${LINE}`, background: "#F5F5F3",
        borderRadius: "0 0 4px 4px",
      }}>
      ⚺ Amazon で見る
    </a>
  );
}

export default function App() {
  const [tab, setTab] = useState("search");
  const [settings, setSettings] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [wantToRead, setWantToRead] = useState([]);
  const [readBooks, setReadBooks] = useState([]);
  const [toast, setToast] = useState(null);
  const [newWantTitle, setNewWantTitle] = useState("");
  const [newWantAuthor, setNewWantAuthor] = useState("");
  const [newReadTitle, setNewReadTitle] = useState("");
  const [newReadAuthor, setNewReadAuthor] = useState("");
  const settingsTimer = useRef(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    // マイグレーション
    const oldData = localStorage.getItem("fuel:bookmarks");
    if (oldData && !localStorage.getItem("fuel:wantToRead")) {
      localStorage.setItem("fuel:wantToRead", oldData);
      localStorage.removeItem("fuel:bookmarks");
    }
    localStorage.removeItem("fuel:signals");

    setSettings(storage.get("settings") || "");
    setSelectedGenres(storage.getJSON("genres", []));
    setWantToRead(storage.getJSON("wantToRead", []));
    setReadBooks(storage.getJSON("readBooks", []));
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
      const data = await recommend({ n: 5, settings, genres: selectedGenres, excludeList: [] });
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
      const data = await recommend({ n: 5, settings, genres: selectedGenres, excludeList });
      setRecommendations((prev) => [...prev, ...data]);
    } catch {
      setError("取得に失敗しました。再試行してください。");
    }
    setLoadingMore(false);
  };

  const handleWantToRead = (card) => {
    const entry = {
      id: String(Date.now()),
      title: card.title, author: card.author,
      publisher: card.publisher, reason: card.reason,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...wantToRead];
    setWantToRead(next);
    storage.setJSON("wantToRead", next);
    showToast("読みたいリストに追加しました");
  };

  const handleMarkAsRead = (id) => {
    const item = wantToRead.find((b) => b.id === id);
    if (!item) return;
    const nextWant = wantToRead.filter((b) => b.id !== id);
    const nextRead = [{ ...item, readAt: new Date().toISOString() }, ...readBooks];
    setWantToRead(nextWant);
    setReadBooks(nextRead);
    storage.setJSON("wantToRead", nextWant);
    storage.setJSON("readBooks", nextRead);
    showToast("読んだリストに移動しました");
  };

  const handleDeleteWant = (id) => {
    const next = wantToRead.filter((b) => b.id !== id);
    setWantToRead(next);
    storage.setJSON("wantToRead", next);
  };

  const handleDeleteRead = (id) => {
    const next = readBooks.filter((b) => b.id !== id);
    setReadBooks(next);
    storage.setJSON("readBooks", next);
  };

  const handleAddWant = () => {
    const title = newWantTitle.trim();
    if (!title) return;
    const entry = {
      id: String(Date.now()), title,
      author: newWantAuthor.trim(), publisher: "", reason: "",
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...wantToRead];
    setWantToRead(next);
    storage.setJSON("wantToRead", next);
    setNewWantTitle("");
    setNewWantAuthor("");
  };

  const handleAddRead = () => {
    const title = newReadTitle.trim();
    if (!title) return;
    const entry = {
      id: String(Date.now()), title,
      author: newReadAuthor.trim(), publisher: "",
      readAt: new Date().toISOString(),
    };
    const next = [entry, ...readBooks];
    setReadBooks(next);
    storage.setJSON("readBooks", next);
    setNewReadTitle("");
    setNewReadAuthor("");
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
  const inputSt = {
    fontFamily: HI, fontSize: 16, color: INK, background: WHITE,
    border: `1px solid ${LINE2}`, borderRadius: 4, padding: "8px 12px",
    boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ fontFamily: HI, background: BG, minHeight: "100vh", padding: "16px 14px", boxSizing: "border-box", color: INK, maxWidth: 640, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: INK, color: WHITE, fontFamily: HI, fontSize: 12,
          padding: "8px 16px", borderRadius: 4, zIndex: 100, whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: HE, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Fuel</span>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${LINE}`, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {TABS.map(({ id, label }) => {
            const a = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                fontFamily: HI, background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: a ? 600 : 400, color: a ? INK : PALE,
                padding: "10px 4px", marginRight: 20,
                borderBottom: a ? `2px solid ${INK}` : "2px solid transparent",
                marginBottom: -1, whiteSpace: "nowrap",
              }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* 探すタブ */}
      {tab === "search" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <textarea
              ref={textareaRef}
              style={{
                fontFamily: HI, fontSize: 16, color: INK, lineHeight: 1.9, background: WHITE,
                border: `1px solid ${LINE2}`, borderRadius: 4, padding: "10px 14px",
                boxSizing: "border-box", outline: "none", width: "100%", minHeight: 80, resize: "vertical",
              }}
              value={settings}
              onChange={(e) => handleSettingsChange(e.target.value)}
              placeholder="好きな作家、好きなジャンル傾向、避けたい要素、いま気になっていること…"
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {GENRES.map((g) => {
              const sel = selectedGenres.includes(g);
              return (
                <button key={g} onClick={() => toggleGenre(g)} style={{
                  fontFamily: HI, fontSize: 12, padding: "5px 14px", borderRadius: 20,
                  cursor: "pointer", border: `1px solid ${sel ? INK : LINE2}`,
                  background: sel ? INK : "transparent", color: sel ? WHITE : INK,
                }}>{g}</button>
              );
            })}
          </div>

          {/* 探すボタン：右寄せ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 11, color: PALE }}>
              {selectedGenres.length === 0 ? "ジャンルを1つ以上選んでください" : ""}
            </span>
            <button style={primaryBtn(!canRecommend)} onClick={handleRecommend} disabled={!canRecommend}>
              探す
            </button>
          </div>

          {error && !loading && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #DC2626", borderRadius: 4,
              padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, color: "#7F1D1D" }}>{error}</span>
              <button style={{ ...ghost, fontSize: 11, padding: "4px 10px" }} onClick={handleRecommend}>再試行</button>
            </div>
          )}

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
                    <button style={ghost} onClick={() => handleWantToRead(card)}>読みたい</button>
                  </div>
                  <AmazonLink title={card.title} author={card.author} />
                </div>
              ))}
              <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
                {loadingMore
                  ? <span style={{ fontSize: 12, color: PALE }}>取得中…</span>
                  : <button style={ghost} onClick={handleMore}>もう少し見たい</button>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* 読みたいタブ */}
      {tab === "wantToRead" && (
        <div>
          <p style={{ fontSize: 12, color: PALE, marginBottom: 16, lineHeight: 1.6 }}>
            {wantToRead.length > 0
              ? "直近10件を参考に探します"
              : "読みたい本を追加すると、それを参考に探します"
            }
          </p>

          {wantToRead.length === 0 && (
            <div style={{ fontSize: 12, color: PALE, paddingBottom: 16 }}>まだ追加されていません</div>
          )}

          {wantToRead.map((b) => (
            <div key={b.id} style={{ border: `1px solid ${LINE2}`, borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{b.title}</div>
                  {(b.author || b.publisher) && (
                    <div style={{ fontSize: 11, color: PALE, marginBottom: b.reason ? 4 : 0 }}>
                      {b.author}{b.publisher && `　${b.publisher}`}
                    </div>
                  )}
                  {b.reason && <p style={{ fontSize: 12, color: PALE, margin: 0, lineHeight: 1.6 }}>{b.reason}</p>}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button style={{ ...ghost, fontSize: 11, padding: "4px 8px" }} onClick={() => handleMarkAsRead(b.id)}>読んだ</button>
                  <button onClick={() => handleDeleteWant(b.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: PALE, padding: "0 4px" }}>×</button>
                </div>
              </div>
              <AmazonLink title={b.title} author={b.author} />
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={{ ...inputSt, width: "100%" }} value={newWantTitle}
                onChange={(e) => setNewWantTitle(e.target.value)}
                placeholder="書名（必須）"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddWant(); }} />
              <input style={{ ...inputSt, width: "100%" }} value={newWantAuthor}
                onChange={(e) => setNewWantAuthor(e.target.value)}
                placeholder="著者（任意）"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddWant(); }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={primaryBtn(!newWantTitle.trim())} onClick={handleAddWant} disabled={!newWantTitle.trim()}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 読んだタブ */}
      {tab === "readBooks" && (
        <div>
          {readBooks.length === 0 && (
            <div style={{ fontSize: 12, color: PALE, paddingBottom: 16 }}>まだ追加されていません</div>
          )}

          {readBooks.map((b) => (
            <div key={b.id} style={{ border: `1px solid ${LINE2}`, borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{b.title}</div>
                  {b.author && (
                    <div style={{ fontSize: 11, color: PALE }}>
                      {b.author}{b.publisher && `　${b.publisher}`}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDeleteRead(b.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: PALE, flexShrink: 0, padding: "0 4px" }}>×</button>
              </div>
              <AmazonLink title={b.title} author={b.author} />
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={{ ...inputSt, width: "100%" }} value={newReadTitle}
                onChange={(e) => setNewReadTitle(e.target.value)}
                placeholder="書名（必須）"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddRead(); }} />
              <input style={{ ...inputSt, width: "100%" }} value={newReadAuthor}
                onChange={(e) => setNewReadAuthor(e.target.value)}
                placeholder="著者（任意）"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddRead(); }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={primaryBtn(!newReadTitle.trim())} onClick={handleAddRead} disabled={!newReadTitle.trim()}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
