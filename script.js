// NOTES TOGGLE
function toggleNote(card) {
  const expand = card.querySelector('.note-expand');
  const readMore = card.querySelector('.note-read-more');
  const isOpen = expand.classList.toggle('open');
  readMore.textContent = isOpen ? 'Close ↑' : 'Read more ↓';
}

// NAV
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// COURSES
document.getElementById('courses-btn').addEventListener('click', function() {
  const list = document.getElementById('courses-list');
  const open = list.classList.toggle('open');
  this.textContent = (open ? '📚 Hide courses' : '📚 Show all 32 university courses');
});

// LIGHTBOX
function openLightbox(img) {
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-img').alt = img.alt;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── SANITY BLOG ──────────────────────────────────────────────────────────
// Replace YOUR_PROJECT_ID with your Sanity project ID once set up.
// Until then the fallback static posts show automatically.
const SANITY_PROJECT_ID = '29y7wn06';
const SANITY_DATASET = 'production'; // your dataset name - 'production' is the default

async function loadSanityPosts() {
  if (SANITY_PROJECT_ID === 'UNCONFIGURED') {
    document.getElementById('blog-loading').style.display = 'none';
    document.getElementById('blog-fallback').style.display = 'grid';
    return;
  }
  var query = encodeURIComponent('*[_type == "post"] | order(publishedAt desc) [0...6] {title, slug, excerpt, publishedAt, "tags": categories[]->title}');
  var url = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET + '?query=' + query;
  try {
    var res = await fetch(url);
    var data = await res.json();
    var posts = data.result;
    if (!posts || posts.length === 0) {
      document.getElementById('blog-loading').style.display = 'none';
      document.getElementById('blog-fallback').style.display = 'grid';
      return;
    }
    var grid = document.getElementById('blog-grid');
    grid.innerHTML = posts.map(function(post) {
      var date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-NZ', {year:'numeric',month:'short',day:'numeric'}) : '';
      var tag = post.tags && post.tags[0] ? post.tags[0] : 'Note';
      return '<div class="note-card"><span class="note-tag">' + tag + '</span><h3>' + post.title + '</h3><p>' + (post.excerpt || '') + '</p><p class="note-date">' + date + '</p></div>';
    }).join('');
    document.getElementById('blog-loading').style.display = 'none';
    document.getElementById('blog-fallback').style.display = 'none';
    grid.style.display = 'grid';
  } catch (err) {
    document.getElementById('blog-loading').style.display = 'none';
    document.getElementById('blog-error').style.display = 'block';
    document.getElementById('blog-error').textContent = 'Could not load posts.';
    document.getElementById('blog-fallback').style.display = 'grid';
  }
}
loadSanityPosts();

// EMAIL OBFUSCATION
(function() {
  var c = [106,101,115,115,101,106,97,99,111,98,115,49,50,54,64,103,109,97,105,108,46,99,111,109];
  var e = c.map(n => String.fromCharCode(n)).join('');
  var m = 'mai'+'lto:'+e;
  document.querySelectorAll('[data-protect-email]').forEach(el => el.href = m);
  document.querySelectorAll('[data-protect-email-text]').forEach(el => el.textContent = e);
})();

// CHATBOT
// ⚠️  REPLACE THIS URL WITH YOUR CLOUDFLARE WORKER URL BEFORE DEPLOYING
// Instructions in cloudflare-worker.js
const WORKER_URL = 'https://jesse-portfolio-rag.jessejjacobs93.workers.dev';

(function() {
  var history = [];
  var isLoading = false;
  var toggle = document.getElementById('ss-chat-toggle');
  var panel = document.getElementById('ss-chat-panel');
  var messages = document.getElementById('ss-chat-messages');
  var input = document.getElementById('ss-chat-input');
  var sendBtn = document.getElementById('ss-chat-send');

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggle.classList.toggle('open');
    if (open) input.focus();
  });
  input.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); } });
  sendBtn.addEventListener('click', send);

  function addMsg(text, role) {
    var d = document.createElement('div');
    d.className = 'ss-msg ' + (role==='user' ? 'ss-msg-user' : 'ss-msg-bot');
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    var text = input.value.trim();
    if (!text || isLoading) return;
    input.value = '';
    addMsg(text, 'user');
    history.push({role:'user', content:text});
    isLoading = true; sendBtn.disabled = true; input.disabled = true;
    var t = document.createElement('div');
    t.className = 'ss-msg ss-msg-typing'; t.textContent = 'Thinking…';
    messages.appendChild(t); messages.scrollTop = messages.scrollHeight;
    try {
      var r = await fetch(WORKER_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({messages: history.slice(-10)})
      });
      var data = await r.json();
      t.remove();
      var reply = data.content&&data.content[0]&&data.content[0].text
        ? data.content[0].text
        : 'Sorry, something went wrong. Use the email link to contact Jesse directly.';
      history.push({role:'assistant',content:reply});
      addMsg(reply,'bot');
    } catch(err) {
      t.remove();
      addMsg('Could not connect. Use the email link to contact Jesse.','bot');
    }
    isLoading = false; sendBtn.disabled = false; input.disabled = false;
    input.focus();
  }
})();