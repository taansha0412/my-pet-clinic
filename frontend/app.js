const API = '../backend/';
const $ = (id) => document.getElementById(id);
let poll = null;
let currentPetId = null;

async function api(file, { method = 'GET', data, qs = '' } = {}) {
  const res = await fetch(API + file + qs, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong');
  return json;
}

function say(text, ok = false) {
  const m = $('msg');
  if (!m) return;
  m.textContent = text;
  m.className = ok ? 'ok' : '';
}

function setVetLoginError(text) {
  const errBox = $('vet-login-error');
  if (!errBox) return;
  if (text) {
    errBox.textContent = text;
    errBox.hidden = false;
  } else {
    errBox.textContent = '';
    errBox.hidden = true;
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// "2026-10-28 10:30:00" -> "Wed, 28 Oct 2026, 10:30 am"
function when(s) {
  if (!s) return 'Pending timing';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function localIsoString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

const formData = (form) => Object.fromEntries(new FormData(form));

async function run(fn) {
  try {
    say('');
    await fn();
  } catch (e) {
    say(e.message);
  }
}

// ---------- View Navigation ----------
function show(view) {
  for (const v of ['home', 'owner', 'vet', 'dash']) {
    const el = $('view-' + v);
    if (el) el.hidden = v !== view;
  }
  say('');
  setVetLoginError('');
  clearInterval(poll);

  if (view === 'owner') {
    resumeOwner();
  }
}

// ---------- Pet Owner State & UI ----------
function remember(id) {
  try { localStorage.setItem('petId', id); } catch (e) {}
}
function remembered() {
  try { return localStorage.getItem('petId'); } catch (e) { return null; }
}

function renderStatusCard(p) {
  const card = $('status-card');
  if (!card) return;

  const isApproved = p.status === 'approved';
  card.hidden = false;
  card.className = `panel status-panel ${isApproved ? 'is-approved' : 'is-pending'}`;

  card.innerHTML = `
    <div class="status-top-bar">
      <div class="id-badge">
        <span>Assigned Pet ID</span> #${esc(p.id)}
      </div>
      <div class="status-pill ${isApproved ? 'approved' : 'pending'}">
        ${isApproved ? '✅ Approved' : '⏳ Waiting for Approval'}
      </div>
    </div>

    <div class="status-details-grid">
      <div class="detail-item">
        <label>Pet Name</label>
        <div class="value">${esc(p.pet_name)}</div>
      </div>
      <div class="detail-item">
        <label>Owner Name</label>
        <div class="value">${esc(p.owner_name)}</div>
      </div>
    </div>

    <div class="timing-card ${isApproved ? 'approved' : 'pending'}">
      <h3>${isApproved ? '📅 Confirmed Appointment Timing' : '⏳ Appointment Timing'}</h3>
      <div class="time-val">${isApproved ? esc(when(p.appt_time)) : 'Waiting for Vet Confirmation'}</div>
      <p class="muted">
        ${isApproved
          ? 'Your visit time is confirmed! Please arrive 5-10 minutes before your scheduled timing.'
          : 'A veterinarian will review your pet details and assign an appointment date & timing shortly.'}
      </p>
      ${!isApproved ? '<div class="poll-status"><span class="poll-dot"></span> Checking for approval in real time...</div>' : ''}
    </div>

    <div class="status-actions">
      <button type="button" class="btn-subtle" id="btn-register-another">+ Register Another Pet</button>
      <button type="button" class="btn-subtle" id="btn-check-another">Check a Different Pet ID</button>
    </div>
  `;

  // Attach button events
  $('btn-register-another')?.addEventListener('click', () => {
    clearInterval(poll);
    card.hidden = true;
    $('register-panel').scrollIntoView({ behavior: 'smooth' });
    $('pet-form').elements.pet_name.focus();
  });

  $('btn-check-another')?.addEventListener('click', () => {
    $('check-panel').scrollIntoView({ behavior: 'smooth' });
    $('status-form').elements.id.focus();
  });
}

async function checkPet(id, silent = false) {
  if (!id) return null;
  currentPetId = id;
  const p = await api('pets.php', { qs: '?id=' + encodeURIComponent(id) });
  renderStatusCard(p);

  if (p.status === 'approved') {
    clearInterval(poll);
    if (!silent) {
      say(`Pet #${id} is approved! Visit time: ${when(p.appt_time)}`, true);
    }
  } else {
    watch(id);
  }
  return p;
}

function watch(id) {
  clearInterval(poll);
  poll = setInterval(async () => {
    try {
      await checkPet(id, true);
    } catch (e) {
      // If network glitch, silently keep trying
    }
  }, 5000);
}

async function resumeOwner() {
  const id = remembered();
  if (!id) return;
  const idInput = $('status-form')?.elements.id;
  if (idInput) idInput.value = id;
  try {
    await checkPet(id, true);
  } catch (e) {}
}

// Pet form submission
$('pet-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  run(async () => {
    const data = formData(e.target);
    const pet = await api('pets.php', { method: 'POST', data });
    e.target.reset();
    remember(pet.id);
    const idInput = $('status-form')?.elements.id;
    if (idInput) idInput.value = pet.id;

    renderStatusCard(pet);
    watch(pet.id);
    say(`Success! Pet registered. Your assigned ID is #${pet.id}. Waiting for vet approval.`, true);
    $('status-card')?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Status check submission
$('status-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  run(async () => {
    const id = formData(e.target).id;
    const pet = await checkPet(id);
    remember(id);
    $('status-card')?.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- Veterinarian Dashboard & Auth ----------
async function loadDash() {
  const { pending = [], approved = [] } = await api('vets.php');

  // Update counters
  const pendingCountEl = $('pending-count');
  if (pendingCountEl) {
    pendingCountEl.textContent = `${pending.length} waiting`;
  }
  const approvedCountEl = $('approved-count');
  if (approvedCountEl) {
    approvedCountEl.textContent = `${approved.length} approved`;
  }

  // Pending list
  const pendingUl = $('pending');
  if (pendingUl) {
    const minTime = localIsoString();
    pendingUl.innerHTML = pending.length
      ? pending.map((p) => `
          <li>
            <div class="pet-info">
              <strong>${esc(p.pet_name)}</strong>
              <small>Owner: ${esc(p.owner_name)} &bull; <strong>Pet ID #${p.id}</strong></small>
            </div>
            <div class="approve-box">
              <input type="datetime-local" min="${minTime}" aria-label="Date and time for ${esc(p.pet_name)}">
              <button type="button" data-approve="${p.id}" data-name="${esc(p.pet_name)}">Approve</button>
            </div>
          </li>
        `).join('')
      : '<li class="muted">No pets are currently waiting for approval.</li>';
  }

  // Approved list
  const approvedUl = $('approved');
  if (approvedUl) {
    approvedUl.innerHTML = approved.length
      ? approved.map((p) => `
          <li>
            <div class="pet-info">
              <strong>${esc(p.pet_name)}</strong>
              <small>Owner: ${esc(p.owner_name)} &bull; <strong>Pet ID #${p.id}</strong></small>
            </div>
            <div class="approved-timing">
              <span class="time-str">📅 ${esc(when(p.appt_time))}</span>
              <small>Approved by Dr. ${esc(p.vet || 'Vet')}</small>
            </div>
          </li>
        `).join('')
      : '<li class="muted">No approved visits yet.</li>';
  }
}

async function showVetState() {
  try {
    const { name } = await api('auth.php', { qs: '?action=me' });
    const sess = $('session');
    if (sess) {
      sess.innerHTML = name
        ? `<span>👨‍⚕️ Dr. ${esc(name)}</span><button id="logout">Log out</button>`
        : '';
    }
    return name;
  } catch (e) {
    return null;
  }
}

// Vet login submission
$('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  setVetLoginError('');
  say('');
  run(async () => {
    try {
      await api('auth.php', { method: 'POST', qs: '?action=login', data: formData(e.target) });
    } catch (err) {
      setVetLoginError(err.message || 'Wrong name or password');
      throw err;
    }
    e.target.reset();
    await showVetState();
    await loadDash();
    show('dash');
    say('Logged in successfully.', true);
  });
});

// ---------- Global Click Handling ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go], [data-approve], #logout');
  if (!t) return;

  // View navigation
  if (t.dataset.go) {
    e.preventDefault();
    const targetView = t.dataset.go;
    show(targetView);

    if (targetView === 'vet') {
      run(async () => {
        const loggedIn = await showVetState();
        if (loggedIn) {
          await loadDash();
          show('dash');
        }
      });
    }
  }

  // Vet Approving an Appointment
  if (t.dataset.approve) {
    const petId = t.dataset.approve;
    const petName = t.dataset.name || 'Pet';
    const parent = t.closest('.approve-box') || t.parentElement;
    const input = parent ? parent.querySelector('input[type="datetime-local"]') : null;
    const whenVal = input ? input.value : '';

    if (!whenVal) {
      say(`Please pick a date and timing for ${petName} before approving.`);
      if (input) input.focus();
      return;
    }

    run(async () => {
      await api('appointments.php', {
        method: 'POST',
        data: { pet_id: petId, appt_time: whenVal }
      });
      await loadDash();
      say(`Approved! Visit timing for ${petName} (ID #${petId}) confirmed.`, true);
    });
  }

  // Logout
  if (t.id === 'logout') {
    run(async () => {
      await api('auth.php', { qs: '?action=logout' });
      await showVetState();
      show('home');
      say('Logged out successfully.', true);
    });
  }
});

// Initial boot
show('home');
showVetState();
