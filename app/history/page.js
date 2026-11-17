'use client';

import { useEffect, useState } from 'react';

const KEY = 'publication-extractor-history';

export default function HistoryPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      setItems([]);
    }
  }, []);

  function clearHistory() {
    localStorage.removeItem(KEY);
    setItems([]);
  }

  return (
    <div className="content-wrap">
      <header className="page-header history-header">
        <div>
          <span className="eyebrow">History</span>
          <h1>Extraction history</h1>
          <p>Previous extraction summaries are stored in this browser. The TXT source is also saved locally by the Next.js server using the selected-source filename.</p>
        </div>
        {items.length > 0 && <button className="secondary" onClick={clearHistory}>Clear history</button>}
      </header>

      <section className="card">
        {!items.length ? (
          <div className="empty-state">
            <div className="empty-icon">◷</div>
            <h2>No extraction history</h2>
            <p>Completed downloads will appear here.</p>
          </div>
        ) : (
          <div className="history-list">
            {items.map(item => (
              <div className="history-item" key={item.id}>
                <div>
                  <strong>{item.outputFile}</strong>
                  <span>{item.sourceLabel} · {item.records} records · source saved as {item.savedSourceFile} · {item.createdAt}</span>
                </div>
                <span className="history-badge">{item.format?.toUpperCase() || 'READY'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
