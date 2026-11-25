// Generator: builds the card URL from the form, updates the preview, the
// snippets and the gallery, and keeps the state in the page URL.
const config = JSON.parse(document.getElementById('config').textContent);
const form = document.getElementById('controls');
const $ = (id) => document.getElementById(id);

const USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const CHECKBOXES = ['show_icons', 'hide_border', 'animate', 'hide_archived', 'hide_stats'];
const TEXT_FIELDS = [
  'username',
  'theme',
  'layout',
  'palette',
  'langs_count',
  'hide',
  'repos_count',
  'exclude',
];

/** "html,  css," -> "html,css" */
const csv = (value) =>
  value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(',');

const cardById = (id) => config.cards.find((c) => c.id === id) ?? config.cards[0];

function readState() {
  const s = {
    username: form.elements.username.value.trim().replace(/^@/, ''),
    card: form.elements.card.value,
    theme: form.elements.theme.value,
    layout: form.elements.layout.value,
    palette: form.elements.palette.value,
    langs_count: form.elements.langs_count.value,
    hide: csv(form.elements.hide.value),
    repos_count: form.elements.repos_count.value,
    exclude: csv(form.elements.exclude.value),
  };
  for (const name of CHECKBOXES) s[name] = form.elements[name].checked ? 'true' : 'false';
  return s;
}

function writeState(params) {
  for (const name of TEXT_FIELDS) {
    if (params.has(name)) form.elements[name].value = params.get(name);
  }
  for (const name of CHECKBOXES) {
    if (params.has(name)) form.elements[name].checked = params.get(name) === 'true';
  }
  if (params.has('card')) {
    const radio = form.querySelector(
      `input[name="card"][value="${CSS.escape(params.get('card'))}"]`,
    );
    if (radio) radio.checked = true;
  }
}

/** Only the parameters the card uses and that differ from the default. */
function cardParams(s, overrides = {}) {
  const card = cardById(s.card);
  const state = { ...s, ...overrides };
  const params = new URLSearchParams({ username: state.username, ...card.fixed });
  for (const key of [...card.options, ...config.common]) {
    if (state[key] !== config.defaults[key]) params.set(key, state[key]);
  }
  return params;
}

const cardUrl = (s, overrides) =>
  `${location.origin}${cardById(s.card).path}?${cardParams(s, overrides)}`;

function setStatus(text) {
  $('status').textContent = text;
  $('preview').classList.toggle('has-status', Boolean(text));
}

let galleryKey = '';
function updateGallery(s) {
  // The gallery only reloads when something other than the theme changes.
  const key = cardUrl({ ...s, theme: '' });
  if (key !== galleryKey) {
    galleryKey = key;
    for (const tile of document.querySelectorAll('.tile')) {
      tile.querySelector('img').src = cardUrl(s, { theme: tile.dataset.theme, animate: 'false' });
    }
  }
  for (const tile of document.querySelectorAll('.tile')) {
    tile.setAttribute('aria-pressed', String(tile.dataset.theme === s.theme));
  }
}

function update() {
  const s = readState();
  const card = cardById(s.card);

  for (const el of form.querySelectorAll('[data-option]')) {
    el.hidden = !card.options.includes(el.dataset.option);
  }
  $('options').hidden = card.options.length === 0;

  const page = new URLSearchParams(cardParams(s));
  page.delete('type');
  if (card.id !== config.cards[0].id) page.set('card', card.id);
  history.replaceState(null, '', `${location.pathname}?${page}`);

  if (!USERNAME.test(s.username)) {
    setStatus(s.username ? 'That is not a valid GitHub username.' : 'Enter a GitHub username.');
    $('preview-img').removeAttribute('src');
    $('markdown').textContent = '';
    $('html').textContent = '';
    return;
  }

  const url = cardUrl(s);
  const img = $('preview-img');
  if (img.getAttribute('src') !== url) {
    setStatus('Loading…');
    img.src = url;
  }
  $('markdown').textContent = `![${card.alt}](${url})`;
  $('html').textContent = `<img src="${url}" alt="${card.alt}" />`;
  updateGallery(s);
}

$('preview-img').addEventListener('load', () => setStatus(''));
$('preview-img').addEventListener('error', () =>
  setStatus('Could not load the card. Try again in a moment.'),
);

let timer;
form.addEventListener('input', (e) => {
  clearTimeout(timer);
  // Typing in a text field waits a moment; selects and checkboxes apply at once.
  const typing = e.target.matches('input[type="text"], input:not([type]), input[type="number"]');
  timer = setTimeout(update, typing ? 450 : 0);
});
form.addEventListener('submit', (e) => e.preventDefault());

for (const tile of document.querySelectorAll('.tile')) {
  tile.addEventListener('click', () => {
    form.elements.theme.value = tile.dataset.theme;
    update();
    const preview = $('preview').getBoundingClientRect();
    if (preview.top < 0 || preview.bottom > innerHeight) {
      $('preview').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const text = $(button.dataset.copy).textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Press Ctrl+C';
      getSelection().selectAllChildren($(button.dataset.copy));
    }
    setTimeout(() => (button.textContent = 'Copy'), 1500);
  });
}

writeState(new URLSearchParams(location.search));
update();
