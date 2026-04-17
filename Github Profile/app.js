'use strict';

/* ══════════════════════════════════════════════
   THREE.JS BACKGROUND PARTICLE FIELD
══════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 400;

  const COUNT = 180;
  const positions = new Float32Array(COUNT * 3);
  const spread = 600;
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x5bc0be,
    size: 1.8,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Connecting lines between nearby points
  const lineMat = new THREE.LineBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.10 });
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = [];
  const threshold = 100;
  for (let i = 0; i < COUNT; i++) {
    for (let j = i + 1; j < COUNT; j++) {
      const dx = positions[i*3] - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dz = positions[i*3+2] - positions[j*3+2];
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < threshold) {
        linePositions.push(positions[i*3], positions[i*3+1], positions[i*3+2]);
        linePositions.push(positions[j*3], positions[j*3+1], positions[j*3+2]);
      }
    }
  }
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.0005;
    points.rotation.y = t + mouseX;
    points.rotation.x = mouseY * 0.5;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   3D WIREFRAME GLOBE (second canvas)
══════════════════════════════════════════════ */
(function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(240, 240);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 2.8;

  // Wireframe sphere
  const geo = new THREE.SphereGeometry(1, 24, 16);
  const wf = new THREE.WireframeGeometry(geo);
  const mat = new THREE.LineBasicMaterial({ color: 0x5bc0be, transparent: true, opacity: 0.35 });
  const globe = new THREE.LineSegments(wf, mat);
  scene.add(globe);

  // Inner glow sphere
  const innerGeo = new THREE.SphereGeometry(0.96, 16, 12);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x5bc0be, transparent: true, opacity: 0.04 });
  scene.add(new THREE.Mesh(innerGeo, innerMat));

  // Orbit ring
  const ringGeo = new THREE.TorusGeometry(1.3, 0.008, 8, 60);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  scene.add(ring);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    globe.rotation.y = t;
    globe.rotation.x = Math.sin(t * 0.3) * 0.2;
    ring.rotation.z = t * 0.3;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   TYPING EFFECT
══════════════════════════════════════════════ */
const typingPhrases = [
  'Discover any developer at warp speed.',
  'Explore repos, stars, and contributions.',
  'Find your next open-source collaborator.',
  'Search • Analyze • Connect.',
  'All in stunning 3D space.',
];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typingEl = document.getElementById('typing-text');

function typeLoop() {
  if (!typingEl) return;
  const phrase = typingPhrases[phraseIdx];
  if (!deleting) {
    typingEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) {
      deleting = true;
      setTimeout(typeLoop, 2200);
      return;
    }
  } else {
    typingEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % typingPhrases.length;
    }
  }
  setTimeout(typeLoop, deleting ? 38 : 68);
}
typeLoop();

/* ══════════════════════════════════════════════
   STATE & RECENTS
══════════════════════════════════════════════ */
const MAX_RECENTS = 5;

function getRecents() {
  try { return JSON.parse(localStorage.getItem('gf_recents') || '[]'); }
  catch { return []; }
}

function saveRecent(username) {
  let arr = getRecents().filter(u => u.toLowerCase() !== username.toLowerCase());
  arr.unshift(username);
  if (arr.length > MAX_RECENTS) arr = arr.slice(0, MAX_RECENTS);
  localStorage.setItem('gf_recents', JSON.stringify(arr));
  renderRecents();
}

function removeRecent(username) {
  let arr = getRecents().filter(u => u.toLowerCase() !== username.toLowerCase());
  localStorage.setItem('gf_recents', JSON.stringify(arr));
  renderRecents();
}

function renderRecents() {
  const arr = getRecents();
  const chips = document.getElementById('recents-chips');
  const label = document.getElementById('recents-label');
  if(!chips || !label) return;
  chips.innerHTML = '';
  if (arr.length === 0) { label.style.display = 'none'; return; }
  label.style.display = 'block';
  arr.forEach(u => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `<span>@${u}</span><span class="chip-remove" data-user="${u}" title="Remove">✕</span>`;
    chip.querySelector('span:first-child').addEventListener('click', () => {
      document.getElementById('search-input').value = u;
      searchUser(u);
    });
    chip.querySelector('.chip-remove').addEventListener('click', e => {
      e.stopPropagation();
      removeRecent(u);
    });
    chips.appendChild(chip);
  });
}

// Initial render only if DOM elements are present
if (document.getElementById('recents-chips')) {
  renderRecents();
}


/* ══════════════════════════════════════════════
   LANGUAGE COLOR MAP
══════════════════════════════════════════════ */
const LANG_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5', Go:'#00ADD8',
  Rust:'#dea584', Java:'#b07219', 'C++':'#f34b7d', C:'#555555', HTML:'#e34c26',
  CSS:'#563d7c', Vue:'#4FC08D', Ruby:'#701516', PHP:'#4F5D95', Swift:'#F05138',
  Kotlin:'#A97BFF', Dart:'#00B4AB', Shell:'#89e051', Scala:'#DC322F',
  'Jupyter Notebook':'#DA5B0B', R:'#198CE7', Haskell:'#5e5086', Elixir:'#6e4a7e',
  Clojure:'#db5855', Lua:'#000080', default:'#8b949e'
};

function langColor(lang) {
  return lang ? (LANG_COLORS[lang] || LANG_COLORS.default) : LANG_COLORS.default;
}

/* ══════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════ */
function animateCount(el, target) {
  const duration = 900;
  const start = Date.now();
  const initial = parseInt(el.textContent.replace(/,/g,'')) || 0;
  function step() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(initial + (target - initial) * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════
   UI STATE MANAGEMENT
══════════════════════════════════════════════ */
function showSection(name) {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('error-state').style.display = 'none';
  document.getElementById('profile-section').style.display = 'none';
  document.getElementById('globe-section').style.display = 'flex';

  if (name === 'loader') {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('globe-section').style.display = 'none';
  } else if (name === 'error') {
    document.getElementById('error-state').style.display = 'block';
  } else if (name === 'profile') {
    document.getElementById('profile-section').style.display = 'block';
  }
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══════════════════════════════════════════════
   3D CARD TILT
══════════════════════════════════════════════ */
function attachTilt(card) {
  if (!card) return;
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -8;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 8;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.01,1.01,1.01)`;
    card.style.boxShadow = `0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(91,192,190,0.25)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
}

/* ══════════════════════════════════════════════
   FORMAT HELPERS
══════════════════════════════════════════════ */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════
   RENDER PROFILE
══════════════════════════════════════════════ */
function renderProfile(user, repos) {
  // Avatar
  document.getElementById('avatar').src = user.avatar_url + '&s=200';
  document.getElementById('avatar').alt = `${user.login}'s avatar`;

  // Name / login
  document.getElementById('profile-name').textContent = user.name || user.login;
  document.getElementById('profile-login').textContent = `@${user.login}`;

  // Bio
  const bioEl = document.getElementById('profile-bio');
  bioEl.textContent = user.bio || 'No bio provided.';

  // Meta
  const metaEl = document.getElementById('profile-meta');
  const metaItems = [
    user.location   && { icon:'📍', text: user.location },
    user.company    && { icon:'🏢', text: user.company },
    user.blog       && { icon:'🔗', text: user.blog, href: user.blog.startsWith('http') ? user.blog : 'https://' + user.blog },
    user.twitter_username && { icon:'🐦', text: '@'+user.twitter_username, href:'https://twitter.com/'+user.twitter_username },
    user.created_at && { icon:'📅', text: 'Joined '+formatDate(user.created_at) },
  ].filter(Boolean);
  metaEl.innerHTML = metaItems.map(m =>
    m.href
      ? `<a class="meta-item" href="${escHtml(m.href)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><span>${m.icon}</span><span>${escHtml(m.text)}</span></a>`
      : `<span class="meta-item"><span>${m.icon}</span><span>${escHtml(m.text)}</span></span>`
  ).join('');

  // Actions
  document.getElementById('profile-actions').innerHTML = `
    <a class="btn-primary" href="${escHtml(user.html_url)}" target="_blank" rel="noopener" id="view-gh-btn">
      <svg viewBox="0 0 24 24" width="14" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.845c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12C22 6.477 17.523 2 12 2z"/></svg>
      View on GitHub
    </a>
  `;

  // Stats
  const statsData = [
    { label: 'Repositories', val: user.public_repos },
    { label: 'Followers',    val: user.followers },
    { label: 'Following',    val: user.following },
    { label: 'Gists',        val: user.public_gists },
  ];
  const statsGrid = document.getElementById('stats-grid');
  statsGrid.innerHTML = statsData.map((s, i) =>
    `<div class="stat-card"><span class="stat-val" id="stat-${i}">0</span><span class="stat-label">${s.label}</span></div>`
  ).join('');
  statsData.forEach((s, i) => animateCount(document.getElementById(`stat-${i}`), s.val));

  // Sort repos by stars
  const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  const reposGrid = document.getElementById('repos-grid');
  reposGrid.innerHTML = sorted.map(r => `
    <a class="repo-card" href="${escHtml(r.html_url)}" target="_blank" rel="noopener" aria-label="${escHtml(r.name)} repository">
      <div class="repo-name">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h8.586a1.5 1.5 0 0 1 1.06.44l5.915 5.914A1.5 1.5 0 0 1 18.5 8.5V21.5a1.5 1.5 0 0 1-1.5 1.5H2.5A1.5 1.5 0 0 1 1 21.5v-19z"/></svg>
        ${escHtml(r.name)}
      </div>
      <p class="repo-desc">${escHtml(r.description) || '<em style="opacity:0.5">No description provided.</em>'}</p>
      <div class="repo-meta">
        ${r.language ? `<span class="repo-stat"><span class="lang-dot" style="background:${langColor(r.language)}"></span>${escHtml(r.language)}</span>` : ''}
        <span class="repo-stat">⭐ ${r.stargazers_count.toLocaleString()}</span>
        <span class="repo-stat">🍴 ${r.forks_count.toLocaleString()}</span>
        ${r.size > 0 ? `<span class="repo-stat">📦 ${r.size > 1024 ? (r.size/1024).toFixed(1)+'MB' : r.size+'KB'}</span>` : ''}
      </div>
    </a>
  `).join('');

  // Attach tilt to cards
  document.querySelectorAll('.repo-card').forEach(card => attachTilt(card));
  attachTilt(document.getElementById('profile-card'));

  // Intersection Observer for fade-in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.repo-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

/* ══════════════════════════════════════════════
   GITHUB API FETCH
══════════════════════════════════════════════ */
let lastUsername = '';

async function searchUser(username) {
  username = username.trim();
  if (!username) return;
  if (username === lastUsername) return;
  lastUsername = username;

  showSection('loader');
  document.getElementById('loader-text').textContent = `Searching for @${username}...`;

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`)
    ]);

    if (!userRes.ok) {
      const errData = await userRes.json().catch(() => ({}));
      const isRateLimit = userRes.status === 403;
      document.getElementById('error-title').textContent = isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'USER_NOT_FOUND';
      document.getElementById('error-msg').textContent = isRateLimit
        ? 'GitHub API rate limit reached. Please try again in a minute.'
        : `No developer named "@${username}" found in this dimension.`;
      showSection('error');
      lastUsername = '';
      return;
    }

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    renderProfile(user, repos);
    saveRecent(user.login);
    showSection('profile');

    // Update URL hash for sharing
    history.replaceState(null, '', `#${user.login}`);
    document.title = `${user.name || user.login} — GitFinder 3D`;

  } catch (err) {
    document.getElementById('error-title').textContent = 'CONNECTION_ERROR';
    document.getElementById('error-msg').textContent = 'Could not connect to GitHub API. Check your network.';
    showSection('error');
    lastUsername = '';
  }
}

/* ══════════════════════════════════════════════
   SEARCH EVENTS
══════════════════════════════════════════════ */
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    searchUser(document.getElementById('search-input').value);
  });
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchUser(e.target.value);
  });
}

/* ══════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════ */
const themeBtn = document.getElementById('theme-btn');
let isDark = true;

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? '' : 'light');
    themeBtn.textContent = isDark ? '🌙' : '☀️';
    showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled');
  });
}

/* ══════════════════════════════════════════════
   SHARE BUTTON
══════════════════════════════════════════════ */
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied to clipboard!'));
    } else {
      showToast('🔗 Copy this URL: ' + url);
    }
  });
}

/* ══════════════════════════════════════════════
   DEEP LINK FROM HASH
══════════════════════════════════════════════ */
const hash = window.location.hash.replace('#', '').trim();
if (hash && /^[a-zA-Z0-9_-]+$/.test(hash) && document.getElementById('search-input')) {
  document.getElementById('search-input').value = hash;
  setTimeout(() => searchUser(hash), 600);
}
