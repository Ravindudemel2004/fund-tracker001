// 🔗 YOUR GOOGLE SHEET CSV URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRb9bK_83FfurYK6uWQYZ7jqEzrlyfXulFdmt9Tls-q7jhkV1nP2RwKszAiS9F8ds-opsqbOopFfUfW/pub?output=csv";

const MONTHS = ['May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let allData = [];
let activeMonth = "May";
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let filteredData = [];

const fmt = n => `Rs. ${Number(n || 0).toLocaleString('en-LK', { 
  minimumFractionDigits: 0, 
  maximumFractionDigits: 0 
})}`;

const cleanAmt = s => {
  const cleaned = String(s || '').replace(/[^0-9.-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
};

function renderTabs() {
  const container = document.getElementById('month-tabs');
  container.innerHTML = '';
  
  MONTHS.forEach(monthName => {
    const btn = document.createElement('button');
    btn.textContent = monthName;
    btn.className = `tab-btn ${monthName === activeMonth ? 'active' : ''}`;
    btn.onclick = () => { 
      activeMonth = monthName; 
      currentPage = 1;
      renderUI(); 
    };
    container.appendChild(btn);
  });
}

function parseCustomCSV(rows) {
  const data = [];
  
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]?.trim()) continue;
    
    const entry = {
      Index: row[0]?.trim() || '',
      Name: row[1]?.trim() || ''
    };
    
    MONTHS.forEach((month, idx) => {
      const colIndex = idx + 2;
      entry[month] = row[colIndex]?.trim() || '';
    });
    
    data.push(entry);
  }
  
  return data;
}

function filterAndSort() {
  const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
  const sortBy = document.getElementById('sort-select')?.value || 'index';

  filteredData = allData
    .map(row => {
      const name = row.Name || 'Anonymous';
      const index = row.Index || '';
      const amount = cleanAmt(row[activeMonth]);
      return { index, name, amount, month: activeMonth };
    })
    .filter(item => {
      return item.name.toLowerCase().includes(searchTerm) || 
             item.index.toLowerCase().includes(searchTerm);
    });

  filteredData.sort((a, b) => {
    switch(sortBy) {
      case 'index': return parseInt(a.index || 0) - parseInt(b.index || 0);
      case 'name': return a.name.localeCompare(b.name);
      case 'amount-desc': return b.amount - a.amount;
      case 'amount-asc': return a.amount - b.amount;
      default: return 0;
    }
  });
}

function renderUI() {
  const tbody = document.getElementById('contributor-body');
  const overallEl = document.getElementById('overall-total');
  const monthEl = document.getElementById('month-total');
  const statusEl = document.getElementById('status');

  filterAndSort();

  let monthTotal = 0;
  let overallTotal = 0;
  
  allData.forEach(row => {
    MONTHS.forEach(monthName => {
      const amount = cleanAmt(row[monthName]);
      overallTotal += amount;
      if (monthName === activeMonth) monthTotal += amount;
    });
  });

  overallEl.textContent = `Overall Total: ${fmt(overallTotal)}`;
  monthEl.textContent = `${activeMonth} Total: ${fmt(monthTotal)}`;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredData.slice(start, end);

  tbody.innerHTML = '';
  
  if (pageData.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">No donors found matching "${document.getElementById('search-input')?.value || ''}"</td>
      </tr>`;
    statusEl.textContent = `🟢 Live: ${new Date().toLocaleTimeString()}`;
    renderPagination(0);
    return;
  }

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    const amountClass = item.amount > 0 ? 'amount-cell' : 'amount-cell unpaid';
    tr.innerHTML = `
      <td>${item.index ? `<span class="index-badge">${item.index}</span>` : '-'}</td>
      <td class="name-cell">${escapeHtml(item.name)}</td>
      <td class="${amountClass}">${item.amount > 0 ? fmt(item.amount) : '<span class="unpaid-text">-</span>'}</td>
      <td class="month-cell">${item.month}</td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(totalPages);
  const showingEnd = Math.min(end, filteredData.length);
  statusEl.textContent = `✅ Showing ${filteredData.length > 0 ? start + 1 : 0}-${showingEnd} of ${filteredData.length} donors | Updated: ${new Date().toLocaleTimeString()}`;
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';
  
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Prev';
  prevBtn.className = 'page-btn';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderUI(); };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      btn.onclick = () => { currentPage = i; renderUI(); };
      container.appendChild(btn);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.padding = '0.5rem';
      container.appendChild(span);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.className = 'page-btn';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderUI(); };
  container.appendChild(nextBtn);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportData() {
  const csvData = filteredData.map(item => ({
    Index: item.index,
    Name: item.name,
    Amount: item.amount > 0 ? item.amount : '',
    Month: item.month
  }));
  
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fund-collection-${activeMonth.toLowerCase()}-2026.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fetchData() {
  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      const rows = Papa.parse(csvText, { skipEmptyLines: false }).data;
      allData = parseCustomCSV(rows);
      renderTabs();
      renderUI();
    })
    .catch(() => {
      document.getElementById('status').textContent = `⚠️ Error loading data`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const exportBtn = document.getElementById('export-btn');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderUI();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentPage = 1;
      renderUI();
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
});

fetchData();
setInterval(fetchData, 30000);
