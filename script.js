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
const SANITY_PROJECT_ID = '29y7wn06';
const SANITY_DATASET = 'production';

function showBlogMessage(text) {
  var loading = document.getElementById('blog-loading');
  var error = document.getElementById('blog-error');
  var grid = document.getElementById('blog-grid');
  if (loading) loading.style.display = 'none';
  if (grid) grid.style.display = 'none';
  if (error) {
    error.style.display = 'block';
    error.textContent = text;
  }
}

async function loadSanityPosts() {
  var query = encodeURIComponent('*[_type == "post"] | order(publishedAt desc) [0...6] {title, slug, excerpt, publishedAt, "tags": categories[]->title}');
  var url = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET + '?query=' + query;
  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var posts = data.result;

    if (!posts || posts.length === 0) {
      showBlogMessage('No posts yet — check back soon.');
      return;
    }

    var grid = document.getElementById('blog-grid');
    grid.innerHTML = '';

    posts.forEach(function(post) {
      var card = document.createElement('div');
      card.className = 'note-card';

      var dateStr = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-NZ', {year:'numeric', month:'short', day:'numeric'})
        : '';
      var tag = (post.tags && post.tags[0]) ? post.tags[0] : 'Note';

      var tagEl = document.createElement('span');
      tagEl.className = 'note-tag';
      tagEl.textContent = tag;

      var titleEl = document.createElement('h3');
      titleEl.textContent = post.title || 'Untitled';

      var excerptEl = document.createElement('p');
      excerptEl.textContent = post.excerpt || '';

      var dateEl = document.createElement('p');
      dateEl.className = 'note-date';
      dateEl.textContent = dateStr;

      card.appendChild(tagEl);
      card.appendChild(titleEl);
      card.appendChild(excerptEl);
      card.appendChild(dateEl);
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

// CHATBOT
const WORKER_URL = 'https://jessejacobs.nz/api/chat';

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