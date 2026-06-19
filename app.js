const state = {
  notices: [],
  filtered: [],
};

const summary = document.querySelector('#summary');
const statusEl = document.querySelector('#status');
const list = document.querySelector('#noticeList');
const template = document.querySelector('#noticeTemplate');
const search = document.querySelector('#search');
const sourceFilter = document.querySelector('#sourceFilter');

function normalize(value) {
  return String(value || '').toLowerCase();
}

function renderSources() {
  const sources = [...new Set(state.notices.map((n) => n.source).filter(Boolean))].sort();
  for (const source of sources) {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = source;
    sourceFilter.appendChild(option);
  }
}

function renderSummary(data) {
  const updatedAt = data.generated_at ? new Date(data.generated_at).toLocaleString('zh-CN') : '未知时间';
  summary.textContent = `共 ${state.notices.length} 条通知，最后更新：${updatedAt}`;
}

function applyFilters() {
  const keyword = normalize(search.value);
  const source = sourceFilter.value;

  state.filtered = state.notices.filter((notice) => {
    const matchesSource = !source || notice.source === source;
    const text = normalize(`${notice.title} ${notice.source} ${notice.section} ${notice.date}`);
    return matchesSource && (!keyword || text.includes(keyword));
  });

  renderList();
}

function renderList() {
  list.textContent = '';
  statusEl.textContent = state.filtered.length ? `当前显示 ${state.filtered.length} 条通知` : '';

  if (!state.filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = state.notices.length ? '没有匹配的通知。' : '暂无通知数据，等待 GitHub Actions 首次运行。';
    list.appendChild(empty);
    return;
  }

  for (const notice of state.filtered) {
    const node = template.content.cloneNode(true);
    const meta = node.querySelector('.notice-meta');
    const title = node.querySelector('.notice-title');

    meta.innerHTML = [notice.source, notice.section, notice.date]
      .filter(Boolean)
      .map((item) => `<span>${item}</span>`)
      .join('');

    title.href = notice.url;
    title.textContent = notice.title;
    list.appendChild(node);
  }
}

async function main() {
  try {
    const response = await fetch(`notices.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.notices = Array.isArray(data.notices) ? data.notices : [];
    state.notices.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    renderSources();
    renderSummary(data);
    applyFilters();
  } catch (error) {
    summary.textContent = '通知数据加载失败';
    list.innerHTML = `<div class="empty">无法加载 notices.json：${error.message}</div>`;
  }
}

search.addEventListener('input', applyFilters);
sourceFilter.addEventListener('change', applyFilters);
main();
