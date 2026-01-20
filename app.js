/**
 * GP-5 COMPANION - CORE LOGIC
 * Simulazione fedele del workflow Valeton GP-5
 */

// --- CONFIGURAZIONE E DATI ---

const guitars = {
    'tele': { name: 'Telecaster (Stock)', profile: 'bright', lowCut: 80, highCut: 1.5 },
    'lp': { name: 'Les Paul (SD Slash)', profile: 'warm', lowCut: 60, highCut: 0 },
    'gio': { name: 'Ibanez GIO', profile: 'modern', lowCut: 90, highCut: 0.5 }
};

const songDatabase = [
    { id: 'cnumb', artist: 'Pink Floyd', title: 'Comfortably Numb', sections: ['Verse', 'Chorus', 'Solo'] },
    { id: 'foxylady', artist: 'Jimi Hendrix', title: 'Foxy Lady', sections: ['Verse', 'Solo'] },
    { id: 'whiteroom', artist: 'Cream', title: 'White Room', sections: ['Intro', 'Chorus', 'Solo'] },
    { id: 'fortson', artist: 'CCR', title: 'Fortunate Son', sections: ['Rhythm'] },
    { id: 'interstate', artist: 'STP', title: 'Interstate Love Song', sections: ['Verse', 'Chorus'] },
    { id: 'neilyoung', artist: 'Neil Young', title: 'Rocking in Free World', sections: ['Rhythm', 'Solo'] },
    { id: 'beatles', artist: 'The Beatles', title: 'Come Together', sections: ['Verse'] }
];

const namProfiles = [
    { id: 'gilmour_lead', name: 'Gilmour DR103 Capture', type: 'Lead' },
    { id: 'plexi_70', name: 'Plexi 1959 Full', type: 'Crunch' },
    { id: 'tweed_lux', name: 'Tweed Lux 5E3', type: 'Clean' }
];

// --- STATO DELL'APPLICAZIONE ---

let state = {
    currentView: 'songlist',
    currentGuitar: 'lp',
    activeSong: null,
    activeSection: null,
    activeChain: [],
    isLocked: false,
    lockTimer: null,
    tunerActive: false
};

// --- LOGICA MOTORE PRESET ---

function getPresetFor(songId, section, guitarId) {
    const gui = guitars[guitarId];
    let chain = [];

    // Template logico semplificato per la demo, espandibile per ogni brano
    if (section === 'Solo' || songId === 'cnumb') {
        chain = [
            { id: 'NR', name: 'Noise Gate', on: true, params: { thres: -35 } },
            { id: 'DST', name: 'Sustainer', on: true, params: { drive: 70, tone: 50 } },
            { id: 'AMP', name: 'UK Lead', on: true, mode: 'NAM', params: { profile: 'gilmour_lead', gain: 5, tone: 1 } },
            { id: 'CAB', name: '4x12 Green', on: true, params: { hicut: 6.5 } },
            { id: 'EQ', name: 'Graphic EQ', on: true, params: { '80Hz': 0, '160Hz': 0, '400Hz': -2, '1k6': 3, '3k2': 0, '6k4': -1 } },
            { id: 'DLY', name: 'Analog Delay', on: true, params: { time: 450, feedback: 35, mix: 22 } },
            { id: 'REV', name: 'Large Hall', on: true, params: { decay: 2.5, mix: 15 } }
        ];
    } else {
        chain = [
            { id: 'PRE', name: 'Comp', on: true, params: { sustain: 40 } },
            { id: 'AMP', name: 'US Clean', on: true, mode: 'STD', params: { gain: 30, bass: 50, mid: 40, tre: 60 } },
            { id: 'CAB', name: '2x12 Silver', on: true, params: { hicut: 8.0 } },
            { id: 'REV', name: 'Room', on: true, params: { decay: 1.2, mix: 10 } }
        ];
    }

    // Adattamento Guitar Tech
    chain.forEach(mod => {
        if (mod.id === 'AMP' && gui.profile === 'bright') mod.params.tre = (mod.params.tre || 50) - 10;
        if (mod.id === 'AMP' && gui.profile === 'warm') mod.params.tre = (mod.params.tre || 50) + 5;
    });

    return chain;
}

// --- FUNZIONI DI UI E RENDERING ---

function init() {
    renderGuitars();
    loadState();
    changeView(state.currentView);
}

function renderGuitars() {
    const sel = document.getElementById('guitar-select');
    sel.innerHTML = Object.entries(guitars).map(([id, g]) => `<option value="${id}">${g.name}</option>`).join('');
    sel.value = state.currentGuitar;
    sel.onchange = (e) => {
        state.currentGuitar = e.target.value;
        saveState();
        if (state.activeSong) openSection(state.activeSong, state.activeSection);
    };
}

function changeView(view) {
    state.currentView = view;
    const container = document.getElementById('main-content');
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));

    if (view === 'songlist') {
        document.getElementById('nav-list').classList.add('active');
        container.innerHTML = songDatabase.map(song => `
            <div class="song-card">
                <div class="song-header">${song.artist} - ${song.title}</div>
                ${song.sections.map(sec => `
                    <div class="section-item" onclick="openSection('${song.id}', '${sec}')">
                        <span>${sec}</span>
                        <small style="color:var(--accent)">LOAD</small>
                    </div>
                `).join('')}
            </div>
        `).join('');
    } else if (view === 'performance') {
        document.getElementById('nav-perf').classList.add('active');
        renderPerformance();
    }
    saveState();
}

function openSection(songId, section) {
    state.activeSong = songId;
    state.activeSection = section;
    state.activeChain = getPresetFor(songId, section, state.currentGuitar);
    renderEditor();
}

function renderEditor() {
    const container = document.getElementById('main-content');
    const song = songDatabase.find(s => s.id === state.activeSong);
    
    container.innerHTML = `
        <div style="padding:15px; border-bottom:1px solid #222;">
            <button onclick="changeView('songlist')" style="background:none; border:1px solid var(--accent); color:var(--accent); padding:5px 10px; border-radius:4px;">< BACK</button>
            <h2 style="margin:10px 0 0 0; font-size:1.2rem;">${song.title}</h2>
            <p style="margin:0; font-size:0.8rem; color:#666;">Sezione: ${state.activeSection}</p>
        </div>
        <div class="chain-list">
            ${state.activeChain.map((mod, idx) => `
                <div class="module-block ${mod.on ? 'on' : ''} ${mod.mode === 'NAM' ? 'nam-mode' : ''}" onclick="editModule(${idx})">
                    <div>
                        <strong>${mod.id}</strong> ${mod.mode === 'NAM' ? '<span style="font-size:0.6rem; background:var(--accent-nam); color:#000; padding:1px 3px; border-radius:2px; margin-left:5px;">NAM</span>' : ''}
                        <br><small>${mod.name}</small>
                    </div>
                    <div class="toggle" onclick="event.stopPropagation(); toggleModule(${idx})">${mod.on ? 'ON' : 'OFF'}</div>
                </div>
            `).join('')}
        </div>
    `;
    updateStatusBar();
}

function renderPerformance() {
    const container = document.getElementById('main-content');
    const song = songDatabase.find(s => s.id === state.activeSong) || songDatabase[0];
    
    container.innerHTML = `
        <div id="perf-view">
            <div style="text-align:center; padding:10px; font-size:0.8rem; color:var(--accent)">LIVE: ${song.title.toUpperCase()}</div>
            <button class="perf-btn ${state.activeSection === 'Verse' ? 'active' : ''}" onclick="perfSwitch('Verse')">VERSE<small>Clean / Rhythm</small></button>
            <button class="perf-btn ${state.activeSection === 'Chorus' ? 'active' : ''}" onclick="perfSwitch('Chorus')">CHORUS<small>Crunch / Drive</small></button>
            <button class="perf-btn ${state.activeSection === 'Solo' ? 'active' : ''}" onclick="perfSwitch('Solo')">SOLO<small>Lead / Boost</small></button>
            <button onclick="toggleLock()" style="margin:10px; background:#222; border:none; color:#666; padding:15px; border-radius:8px;">BLOCCA UI</button>
        </div>
    `;
}

// --- GESTIONE MODULI ---

let editingIdx = null;

function editModule(idx) {
    editingIdx = idx;
    const mod = state.activeChain[idx];
    const sheet = document.getElementById('module-sheet');
    const container = document.getElementById('params-container');
    document.getElementById('sheet-title').innerText = `${mod.id}: ${mod.name}`;

    let html = '';
    if (mod.id === 'EQ') {
        html = `<div class="eq-container">` + 
            Object.entries(mod.params).map(([band, val]) => `
                <div class="eq-fader-wrap">
                    <span class="eq-val">${val}</span>
                    <input type="range" class="eq-fader" min="-12" max="12" step="0.5" value="${val}" oninput="this.previousElementSibling.innerText=this.value">
                    <span class="eq-label">${band}</span>
                </div>
            `).join('') + `</div>`;
    } else if (mod.mode === 'NAM') {
        html = `
            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:0.7rem; color:#888;">PROFILO NAM</label>
                <select id="nam-profile" style="width:100%; padding:12px; background:#333; color:#fff; border:none; border-radius:8px; margin-top:5px;">
                    ${namProfiles.map(p => `<option value="${p.id}" ${mod.params.profile === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
            </div>
            ${renderGenericSliders(mod.params)}
        `;
    } else {
        html = renderGenericSliders(mod.params);
    }

    container.innerHTML = html;
    sheet.classList.add('open');
}

function renderGenericSliders(params) {
    return Object.entries(params).map(([key, val]) => {
        if (key === 'profile') return '';
        return `
            <div style="margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:5px;">
                    <span>${key.toUpperCase()}</span><span>${val}</span>
                </div>
                <input type="range" style="width:100%; accent-color:var(--accent);" value="${val}" oninput="this.parentElement.firstElementChild.lastElementChild.innerText=this.value">
            </div>
        `;
    }).join('');
}

function applyModuleChanges() {
    const mod = state.activeChain[editingIdx];
    const inputs = document.querySelectorAll('#params-container input[type=range]');
    const selects = document.querySelectorAll('#params-container select');
    
    inputs.forEach(input => {
        // In un'app reale mapperemmo i nomi, qui usiamo l'ordine o data-attributes
        const key = input.nextElementSibling?.classList.contains('eq-label') ? input.nextElementSibling.innerText : input.previousElementSibling.firstElementChild.innerText.toLowerCase();
        mod.params[key] = parseFloat(input.value);
    });

    selects.forEach(sel => { if(sel.id === 'nam-profile') mod.params.profile = sel.value; });

    closeSheet();
    renderEditor();
    showToast("Parametri salvati");
}

function toggleModule(idx) {
    state.activeChain[idx].on = !state.activeChain[idx].on;
    if (state.currentView === 'performance') renderPerformance(); else renderEditor();
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    updateStatusBar();
}

function closeSheet() { document.getElementById('module-sheet').classList.remove('open'); }

// --- LIVE & PERFORMANCE ---

function perfSwitch(section) {
    if (state.isLocked) return;
    state.activeSection = section;
    state.activeChain = getPresetFor(state.activeSong, section, state.currentGuitar);
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    renderPerformance();
    updateStatusBar();
}

function toggleLock() {
    state.isLocked = true;
    document.getElementById('ui-lock-overlay').classList.add('active');
}

function handleLockTap() {
    const progress = document.getElementById('lock-progress');
    progress.style.transition = 'width 1.5s linear';
    progress.style.width = '100%';
    
    state.lockTimer = setTimeout(() => {
        state.isLocked = false;
        document.getElementById('ui-lock-overlay').classList.remove('active');
        progress.style.width = '0%';
        if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
    }, 1500);
}

// Interrompe lo sblocco se si alza il dito
window.onmouseup = window.ontouchend = () => {
    clearTimeout(state.lockTimer);
    const progress = document.getElementById('lock-progress');
    progress.style.transition = 'none';
    progress.style.width = '0%';
};

// --- TUNER ---

function openTuner() {
    state.tunerActive = true;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="tuner-screen">
            <div class="note-main">E</div>
            <div id="tuner-cents" style="font-family:monospace; font-size:1.5rem; color:#666;">-12.4</div>
            <div class="needle-container">
                <div id="needle"></div>
            </div>
            <button onclick="this.parentElement.remove(); state.tunerActive=false;" style="margin-top:50px; padding:15px 40px; background:#222; border:none; border-radius:30px; color:#fff;">CHIUDI</button>
        </div>
    `);
    simulateTuner();
}

function simulateTuner() {
    if (!state.tunerActive) return;
    const needle = document.getElementById('needle');
    const centsText = document.getElementById('tuner-cents');
    const val = (Math.random() * 20 - 10).toFixed(1); // Simula oscillazione
    needle.style.transform = `translateX(-50%) rotate(${val * 3}deg)`;
    centsText.innerText = (val > 0 ? '+' : '') + val;
    if (Math.abs(val) < 1) needle.style.background = 'var(--accent)';
    else needle.style.background = 'var(--danger)';
    setTimeout(simulateTuner, 100);
}

// --- PERSISTENZA & UTILS ---

function updateStatusBar() {
    const onCount = state.activeChain.filter(m => m.on).length;
    document.getElementById('status-bar').innerText = `MOD: ${onCount}/11 | 120 BPM | ${state.currentGuitar.toUpperCase()}`;
}

function showToast(msg) {
    const t = document.getElementById('toast-container');
    t.innerHTML = `<div style="background:var(--accent); color:#000; padding:10px 20px; border-radius:5px; margin-top:10px; font-weight:bold; box-shadow:0 4px 15px rgba(0,0,0,0.5)">${msg}</div>`;
    setTimeout(() => t.innerHTML = '', 2000);
}

function saveState() { localStorage.setItem('gp5_sim_state', JSON.stringify(state)); }
function loadState() {
    const saved = localStorage.getItem('gp5_sim_state');
    if (saved) state = JSON.parse(saved);
}

window.onload = init;