const API = '../backend/';
const $ = (id) => document.getElementById(id);

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

const formData = (form) => Object.fromEntries(new FormData(form));

async function loadVets() {
  const vets = await api('vets.php');
  $('vets').innerHTML = vets.map((v) => `<li><span>${esc(v.name)}<small>${esc(v.specialty)}</small></span></li>`).join('');
  $('vet-select').innerHTML = vets.map((v) => `<option value="${v.id}">${esc(v.name)} (${esc(v.specialty)})</option>`).join('');
}

async function loadPets() {
  const pets = await api('pets.php');
  $('pets').innerHTML = pets.length
    ? pets.map((p) => `<li><span>${esc(p.name)}<small>${esc(p.species)}${p.breed ? ', ' + esc(p.breed) : ''}${p.age !== null ? ', ' + p.age + ' yr' : ''}</small></span>
        <button class="danger" data-pet="${p.id}">Remove</button></li>`).join('')
    : '<li>No pets yet. Add your first pet below.</li>';
  $('pet-select').innerHTML = pets.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
}

async function loadAppts() {
  const list = await api('appointments.php');
  $('appts').innerHTML = list.length
    ? list.map((a) => `<li><span>${esc(a.pet)} with ${esc(a.vet)}<small>${esc(a.appt_time)}${a.reason ? ' - ' + esc(a.reason) : ''}</small></span>
        <button class="danger" data-appt="${a.id}">Cancel</button></li>`).join('')
    : '<li>No upcoming visits.</li>';
}

async function showState() {
  const { name } = await api('auth.php', { qs: '?action=me' });
  $('guest').hidden = !!name;
  $('member').hidden = !name;
  $('session').innerHTML = name ? `<span>Hi, ${esc(name)} </span><button id="logout">Log out</button>` : '';
  if (name) { await loadPets(); await loadAppts(); }
}

async function run(fn) {
  try { say(''); await fn(); } catch (e) { say(e.message); }
}

$('login-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => { await api('auth.php', { method: 'POST', qs: '?action=login', data: formData(e.target) }); e.target.reset(); await showState(); }); });

$('register-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => { await api('auth.php', { method: 'POST', qs: '?action=register', data: formData(e.target) }); e.target.reset(); await showState(); }); });

$('pet-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => { await api('pets.php', { method: 'POST', data: formData(e.target) }); e.target.reset(); await loadPets(); say('Pet added', true); }); });

$('appt-form').addEventListener('submit', (e) => { e.preventDefault();
  run(async () => { await api('appointments.php', { method: 'POST', data: formData(e.target) }); await loadAppts(); say('Appointment booked', true); }); });

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.id === 'logout') run(async () => { await api('auth.php', { qs: '?action=logout' }); await showState(); });
  if (t.dataset.pet) run(async () => { await api('pets.php', { method: 'DELETE', qs: '?id=' + t.dataset.pet }); await loadPets(); await loadAppts(); });
  if (t.dataset.appt) run(async () => { await api('appointments.php', { method: 'DELETE', qs: '?id=' + t.dataset.appt }); await loadAppts(); say('Appointment cancelled', true); });
});

run(async () => { await loadVets(); await showState(); });