const API = '../backend/';
const $ = (id) => document.getElementById(id);
let poll = null;

async function api(file, { method = 'GET', data, qs = '' } = {}) {
  const res = await fetch(API + file + qs, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Something went wrong');
  return json;
}

function say(text, ok = false) {
  $('msg').textContent = text;
  $('msg').className = ok ? 'ok' : '';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "2026-11-01 10:30:00" -> "1 Nov 2026, 10:30 am"
function when(s) {
  return new Date(s.replace(' ', 'T')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const formData = (form) => Object.fromEntries(new FormData(form));

async function run(fn) {
  try { say(''); await fn(); } catch (e) { say(e.message); }
}

// ---------- views ----------
function show(view) {
  for (const v of ['home', 'owner', 'vet', 'dash']) $('view-' + v).hidden = v !== view;
  say('');
  clearInterval(poll);
  if (view === 'owner') resumeOwner();
}

// ---------- pet owner ----------
function remember(id) { try { localStorage.setItem('petId', id); } catch (e) {} }
function remembered() { try { return localStorage.getItem('petId'); } catch (e) { return null; } }

async function checkPet(id) {
  const p = await api('pets.php', { qs: '?id=' + encodeURIComponent(id) });
  const card = $('status-card');
  card.hidden = false;
  if (p.status === 'approved') {
    card.className = 'card done';
    card.innerHTML = `<p>${esc(p.pet_name)} (owner: ${esc(p.owner_name)}), ID ${p.id}</p>
      <p class="big">${esc(when(p.appt_time))}</p><p>Your visit time is confirmed. Please arrive a few minutes early.</p>`;
    clearInterval(poll);
  } else {
    card.className = 'card';
    card.innerHTML = `<p>${esc(p.pet_name)} (owner: ${esc(p.owner_name)}), ID ${p.id}</p>
      <p><strong>Waiting for approval.</strong> A vet will give you a time soon. This page updates by itself.</p>`;
  }
  return p;
}

function watch(id) {
  clearInterval(poll);
  poll = setInterval(() => checkPet(id).catch(() => {}), 10000);
}

async function resumeOwner() {
  const id = remembered();
  if (!id) return;
  $('status-form').elements.id.value = id;
  try { const p = await checkPet(id); if (p.status === 'pending') watch(id); } catch (e) {}
}

$('pet-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => {
    const { id } = await api('pets.php', { method: 'POST', data: formData(e.target) });
    e.target.reset();
    remember(id);
    $('status-form').elements.id.value = id;
    await checkPet(id);
    watch(id);
    say(`Registered. Your pet ID is ${id}. Keep it safe and wait for your timing approval.`, true);
  }); });

$('status-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => {
    const id = formData(e.target).id;
    const p = await checkPet(id);
    remember(id);
    if (p.status === 'pending') watch(id);
  }); });

// ---------- vet ----------
async function loadDash() {
  const { pending, approved } = await api('vets.php');
  $('pending').innerHTML = pending.length
    ? pending.map((p) => `<li><span><strong>${esc(p.pet_name)}</strong><small>Owner: ${esc(p.owner_name)} - ID ${p.id}</small></span>
        <span class="approve"><input type="datetime-local" aria-label="Date and time for ${esc(p.pet_name)}">
        <button data-approve="${p.id}">Approve</button></span></li>`).join('')
    : '<li>No pets are waiting.</li>';
  $('approved').innerHTML = approved.length
    ? approved.map((p) => `<li><span><strong>${esc(p.pet_name)}</strong><small>Owner: ${esc(p.owner_name)}</small></span>
        <span>${esc(when(p.appt_time))}</span></li>`).join('')
    : '<li>No approved visits yet.</li>';
}

async function showVetState() {
  const { name } = await api('auth.php', { qs: '?action=me' });
  $('session').innerHTML = name ? `<span>Hi, ${esc(name)} </span><button id="logout">Log out</button>` : '';
  return name;
}

$('login-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => {
    await api('auth.php', { method: 'POST', qs: '?action=login', data: formData(e.target) });
    e.target.reset();
    await showVetState();
    await loadDash();
    show('dash');
  }); });

// ---------- clicks ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go], [data-approve], #logout');
  if (!t) return;
  if (t.dataset.go) {
    e.preventDefault();
    show(t.dataset.go);
    if (t.dataset.go === 'vet') run(async () => { if (await showVetState()) { await loadDash(); show('dash'); } });
  }
  if (t.dataset.approve) {
    const when_ = t.parentElement.querySelector('input').value;
    run(async () => {
      await api('appointments.php', { method: 'POST', data: { pet_id: t.dataset.approve, appt_time: when_ } });
      await loadDash();
      say('Approved. The owner can now see the time.', true);
    });
  }
  if (t.id === 'logout') run(async () => {
    await api('auth.php', { qs: '?action=logout' });
    await showVetState();
    show('home');
  });
});

show('home');
