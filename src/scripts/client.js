// ── NAV ──
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// ── COURSES ──
const coursesBtn = document.getElementById('courses-btn');
if (coursesBtn) {
  coursesBtn.addEventListener('click', function () {
    const list = document.getElementById('courses-list');
    const open = list.classList.toggle('open');
    this.textContent = open ? '📚 Hide courses' : '📚 Show all 32 university courses';
  });
}

// ── LIGHTBOX (rewired from inline onclick to listeners) ──
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
function openLightbox(img) {
  if (!lightbox || !lbImg) return;
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.project-gallery img').forEach(img =>
  img.addEventListener('click', () => openLightbox(img))
);
const lbClose = document.getElementById('lb-close');
if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lightbox) {
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── PRIVACY MODAL (rewired from inline onclick) ──
const privacyModal = document.getElementById('privacy-modal');
const privacyOpen = document.getElementById('privacy-open');
if (privacyOpen && privacyModal) {
  privacyOpen.addEventListener('click', () => privacyModal.classList.add('open'));
}
if (privacyModal) {
  privacyModal.addEventListener('click', e => { if (e.target === privacyModal) privacyModal.classList.remove('open'); });
  const pClose = privacyModal.querySelector('.privacy-close');
  if (pClose) pClose.addEventListener('click', () => privacyModal.classList.remove('open'));
}

// ── SANITY BLOG (client-side: keeps "no redeploy to add posts") ──
const SANITY_PROJECT_ID = '29y7wn06';
const SANITY_DATASET = 'production';
function showBlogMessage(text) {
  const loading = document.getElementById('blog-loading');
  const error = document.getElementById('blog-error');
  const grid = document.getElementById('blog-grid');
  if (loading) loading.style.display = 'none';
  if (grid) grid.style.display = 'none';
  if (error) { error.style.display = 'block'; error.textContent = text; }
}
async function loadSanityPosts() {
  const query = encodeURIComponent('*[_type == "post"] | order(publishedAt desc) [0...6] {title, slug, excerpt, publishedAt, "tags": categories[]->title}');
  const url = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET + '?query=' + query;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const posts = data.result;
    if (!posts || posts.length === 0) { showBlogMessage('No posts yet — check back soon.'); return; }
    const grid = document.getElementById('blog-grid');
    grid.innerHTML = '';
    posts.forEach(function (post) {
      const card = document.createElement('div');
      card.className = 'note-card';
      const dateStr = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-NZ', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';
      const tag = (post.tags && post.tags[0]) ? post.tags[0] : 'Note';
      const tagEl = document.createElement('span'); tagEl.className = 'note-tag'; tagEl.textContent = tag;
      const titleEl = document.createElement('h3'); titleEl.textContent = post.title || 'Untitled';
      const excerptEl = document.createElement('p'); excerptEl.textContent = post.excerpt || '';
      const dateEl = document.createElement('p'); dateEl.className = 'note-date'; dateEl.textContent = dateStr;
      card.append(tagEl, titleEl, excerptEl, dateEl);
      grid.appendChild(card);
    });
    document.getElementById('blog-loading').style.display = 'none';
    document.getElementById('blog-error').style.display = 'none';
    grid.style.display = 'grid';
  } catch (err) {
    showBlogMessage('Could not load posts right now.');
  }
}
loadSanityPosts();

// ── CHATBOT ──
const WORKER_URL = 'https://jessejacobs.nz/api/chat';
(function () {
  const history = [];
  let isLoading = false;
  const toggle = document.getElementById('ss-chat-toggle');
  const panel = document.getElementById('ss-chat-panel');
  const messages = document.getElementById('ss-chat-messages');
  const input = document.getElementById('ss-chat-input');
  const sendBtn = document.getElementById('ss-chat-send');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggle.classList.toggle('open');
    if (open) input.focus();
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  sendBtn.addEventListener('click', send);

  function addMsg(text, role) {
    const d = document.createElement('div');
    d.className = 'ss-msg ' + (role === 'user' ? 'ss-msg-user' : 'ss-msg-bot');
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text || isLoading) return;
    input.value = '';
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    isLoading = true; sendBtn.disabled = true; input.disabled = true;
    const t = document.createElement('div');
    t.className = 'ss-msg ss-msg-typing'; t.textContent = 'Thinking…';
    messages.appendChild(t); messages.scrollTop = messages.scrollHeight;
    try {
      const r = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      const data = await r.json();
      t.remove();
      const reply = data.content && data.content[0] && data.content[0].text
        ? data.content[0].text
        : 'Sorry, something went wrong. Use the email link to contact Jesse directly.';
      history.push({ role: 'assistant', content: reply });
      addMsg(reply, 'bot');
    } catch (err) {
      t.remove();
      addMsg('Could not connect. Use the email link to contact Jesse.', 'bot');
    }
    isLoading = false; sendBtn.disabled = false; input.disabled = false;
    input.focus();
  }
})();
