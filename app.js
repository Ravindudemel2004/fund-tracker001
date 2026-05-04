// 🔗 REPLACE WITH YOUR PUBLISHED GOOGLE SHEETS CSV URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRb9bK_83FfurYK6uWQYZ7jqEzrlyfXulFdmt9Tls-q7jhkV1nP2RwKszAiS9F8ds-opsqbOopFfUfW/pub?output=csv";

// Month mapping (column names to display order)
const MONTHS = {
  'May': '2026-05',
  'June': '2026-06',
  'July': '2026-07',
  'August': '2026-08',
  'September': '2026-09',
  'October': '2026-10',
  'November': '2026-11',
  'December': '2026-12'
};

let allData = [];
let activeMonth = "2026-05"; // Default to May

// ✅ LKR Formatter (Rs. 1,250 style, no decimals)
const fmt = n => `Rs. ${Number(n || 0).toLocaleString('en-LK', { 
  minimumFractionDigits: 0, 
  maximumFractionDigits: 0 
})}`;

const cleanAmt = s => parseFloat(String(s || '').replace(/[^0-9.-]/g, '')) || 0;

function renderTabs() {
  const container = document.getElementById('month-tabs');
  container.innerHTML = '';
  
  Object.keys(MONTHS).forEach(monthName => {
    const monthCode = MONTHS[monthName];
    const btn = document.createElement('button');
    btn.textContent = monthName;
    btn.className = `tab-btn ${monthCode === activeMonth ? 'active' : ''}`;
    btn.onclick = () => { activeMonth = monthCode; renderUI(); };
    container.appendChild(btn);
  });
}

function renderUI() {
  const list = document.getElementById('contributor-list');
  const overallEl = document.getElementById('overall-total');
  const monthEl = document.getElementById('month-total');
  const statusEl = document.getElementById('status');

  // Find the active month column name
  const activeMonthName = Object.keys(MONTHS).find(key => MONTHS[key] === activeMonth);
  
  let monthTotal = 0;
  let overallTotal = 0;
  const contributors = [];

  // Process each row
  allData.forEach(row => {
    const name = row.Name?.trim() || 'Anonymous';
    const index = row.Index?.trim() || '';
    
    // Calculate totals for all months
    Object.keys(MONTHS).forEach(monthName => {
      const amount = cleanAmt(row[monthName]);
      overallTotal += amount;
      
      if (monthName === activeMonthName) {
        monthTotal += amount;
        if (amount > 0) {
          contributors.push({
            index,
            name,
            amount,
            month: activeMonthName
          });
        }
      }
    });
  });

  overallEl.textContent = `Overall Total: ${fmt(overallTotal)}`;
  monthEl.textContent = `${activeMonthName} Total: ${fmt(monthTotal)}`;

  list.innerHTML = '';
  
  if (contributors.length === 0) {
    list.innerHTML = '<div class="empty">No contributions recorded for this month.</div>';
    statusEl.textContent = `🟢 Live: ${new Date().toLocaleTimeString()}`;
    return;
  }

  contributors.forEach(c => {
    const card = document.createElement('div');
    card.className = 'contributor-card';
    card.innerHTML = `
      ${c.index ? `<span class="contributor-index">${c.index}</span>` : ''}
      <div class="contributor-name">${escapeHtml(c.name)}</div>
      <div class="contributor-month">${c.month}</div>
      <div class="contributor-amount">${fmt(c.amount)}</div>
    `;
    list.appendChild(card);
  });
  
  statusEl.textContent = `✅ Updated: ${new Date().toLocaleTimeString()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function fetchData() {
  Papa.parse(SHEET_URL, {
    download: true, header: true, skipEmptyLines: true,
    complete: (res) => {
      allData = res.data;
      renderTabs();
      renderUI();
    },
    error: () => {
      document.getElementById('status').textContent = `⚠️ Error loading data`;
    }
  });
}

fetchData();
setInterval(fetchData, 30000);
