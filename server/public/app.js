const $ = (id) => document.getElementById(id);

function showFlash(msg, ok = true) {
  const el = $('flash');
  el.textContent = msg;
  el.className = 'flash ' + (ok ? 'ok' : 'err');
  el.hidden = false;
  if (ok) setTimeout(() => (el.hidden = true), 2000);
}

function fmtDate(sql) {
  // Expecting "YYYY-MM-DD HH:MM:SS" from MySQL
  if (!sql) return '';
  const s = sql.replace(' ', 'T'); // make it ISO-friendly
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return sql;
  return d.toLocaleString();
}

async function loadFeeds() {
  const res = await fetch('/api/feeds?limit=10');
  const data = await res.json();
  const tbody = $('tbody');
  tbody.innerHTML = '';
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${Number(row.quantity_ml).toFixed(2)}</td>
      <td>${fmtDate(row.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

$('year').textContent = new Date().getFullYear();

$('feedForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const qtyEl = $('qty');
  const raw = qtyEl.value.trim();

  // basic client validation (server will validate again)
  const num = Number(raw);
  if (!raw || !Number.isFinite(num)) {
    showFlash('Please enter a number.', false);
    return;
  }
  if (num <= 0) {
    showFlash('Quantity must be > 0.', false);
    return;
  }
  if (num > 500) {
    showFlash('Quantity must be <= 500 ml.', false);
    return;
  }

  const res = await fetch('/api/feeds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity_ml: num })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    showFlash(body.error || 'Failed to save feed.', false);
    return;
  }

  qtyEl.value = '';
  showFlash('Saved!', true);
  await loadFeeds();
});

// initial load
loadFeeds();
