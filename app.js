// 🔗 REPLACE WITH YOUR PUBLISHED GOOGLE SHEETS CSV URL
const SHEET_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vRb9bK_83FfurYK6uWQYZ7jqEzrlyfXulFdmt9Tls-q7jhkV1nP2RwKszAiS9F8ds-opsqbOopFfUfW/pubhtml;

let allData = [];
let activeMonth = "";

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
const cleanAmt = s => parseFloat(String(s || '').replace(/[^0-9.-]/g, '')) || 0;

function renderTabs(months) {
  const container = document.getElementById('month-tabs');
  container.innerHTML = '';
  months.forEach(m => {
    const btn = document.createElement('button');
    btn.textContent = m;
    btn.className = `tab-btn ${m === activeMonth ? 'active' : ''}`;
    btn.onclick = () => { activeMonth = m; renderUI(); };
    container.appendChild(btn);
  });
}

function renderUI() {
  const list = document.getElementById('donor-list');
  const overallEl = document.getElementById('overall-total');
  const monthEl = document.getElementById('month-total');
  const statusEl = document.getElementById('status');

  // Filter & calculate
  const monthData = allData.filter(d => d.Month?.trim() === activeMonth);
  const monthSum = monthData.reduce((s, d) => s + cleanAmt(d.Amount), 0);
  const overallSum = allData.reduce((s, d) => s + cleanAmt(d.Amount), 0);

  overallEl.textContent = `Overall Total: ${fmt(overallSum)}`;
  monthEl.textContent = `${activeMonth} Total: ${fmt(monthSum)}`;

  list.innerHTML = '';
  if (monthData.length === 0) {
    list.innerHTML = '<div class="empty">No donations recorded for this month.</div>';
    statusEl.textContent = `🟢 Live: ${new Date().toLocaleTimeString()}`;
    return;
  }

  monthData.forEach(d => {
    const card = document.createElement('div');
    card.className = 'donor-card';
    card.innerHTML = `
      <div class="donor-name">${d.Name || 'Anonymous'}</div>
      <div class="donor-amount">${fmt(cleanAmt(d.Amount))}</div>
      <div class="donor-date">${d.Date || ''}</div>
      ${d.Message ? `<div class="donor-msg">"${d.Message}"</div>` : ''}
    `;
    list.appendChild(card);
  });
  statusEl.textContent = `✅ Updated: ${new Date().toLocaleTimeString()}`;
}

function fetchData() {
  Papa.parse(SHEET_URL, {
    download: true, header: true, skipEmptyLines: true,
    complete: (res) => {
      allData = res.data;
      // Extract & sort months chronologically
      const months = [...new Set(allData.map(d => d.Month?.trim()).filter(Boolean))]
                     .sort((a, b) => a.localeCompare(b)); // Works perfectly for YYYY-MM

      if (!activeMonth || !months.includes(activeMonth)) {
        activeMonth = months[months.length - 1] || ""; // Default to latest month
      }
      renderTabs(months);
      renderUI();
    },
    error: (err) => {
      document.getElementById('status').textContent = `⚠️ Error loading data`;
    }
  });
}

fetchData();
setInterval(fetchData, 30000);
