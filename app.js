// --- DIZIONARIO UFFICIALE VALETON GP-5 ---
const AMP_MODELS_GP5 = [
    "USA Clean", "Tweedy", "Bellman", "Dark Twin", "Foxy 30", 
    "J-120 CL", "Match CL", "L-Star", "UK 50", "UK 800", 
    "Z38 OD", "SupDual OD", "Bad-KT OD", "Juice R100", "Flagman+", 
    "Eagle 120", "Power LD", "Mess Dual", "Dizz VH", "Bog Red", 
    "EV 51", "Solo 100 OD", "Solo 100 LD"
];

const namProfiles = [
    { id: 'gilmour_lead', name: 'Hiwatt DR103 Custom', type: 'Lead' },
    { id: 'plexi_70', name: '1959 Plexi Full Jump', type: 'Crunch' },
    { id: 'tweed_lux', name: '5E3 Tweed Deluxe', type: 'Clean' }
];

const guitars = {
    'tele': { name: 'Telecaster (Stock)', profile: 'bright' },
    'lp': { name: 'Les Paul (SD Slash)', profile: 'warm' },
    'gio': { name: 'Ibanez GIO', profile: 'modern' }
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

let state = {
    currentView: 'songlist',
    currentGuitar: 'lp',
    activeSong: null,
    activeSection: 'Verse',
    activeChain: [],
    isLocked: false,
    lockTimer: null,
    tunerActive: false
};

// --- FUNZIONI HELPER PER UI ---

function renderSlider(key, val, min = 0, max = 100, step = 1, unit = "") {
    return `
        <div class="param-row">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:5px;">
                <label>${key.toUpperCase()}</label>
                <span class="param-value" style="color:var(--accent); font-weight:bold;">${val}${unit}</span>
            </div>
            <input type="range" min="${min}" max="${max}" step="${step}" value="${val}" 
                style="width:100%; accent-color:var(--accent);"
                oninput="this.previousElementSibling.querySelector('.param-value').innerText = this.value + '${unit}'">
        </div>
    `;
}

// --- LOGICA CORE ---

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
        if (state.activeSong) openSection(state.activeSong, state.activeSection);
        saveState();
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
                        <span>${sec}</span><small style="color:var(--accent)">LOAD</small>
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
    saveState();
}

function getPresetFor(songId, section, guitarId) {
    let chain = [];
    if (section === 'Solo' || songId === 'cnumb') {
        chain = [
            { id: 'NR', name: 'Noise Gate', on: true, params: { thres: -35 } },
            { id: 'DST', name: 'Sustainer', on: true, params: { drive: 70, tone: 50 } },
            { id: 'AMP', name: 'SnapTone / NAM', on: true, mode: 'NAM', params: { profile: 'gilmour_lead', gainTrim: 0, tone: 0, level: 50 } },
            { id: 'CAB', name: '4x12 Green', on: true, params: { hicut: 6.5 } },
            { id: 'EQ', name: 'Graphic EQ', on: true, params: { '80Hz': 0, '160Hz': 0, '400Hz': -2, '1k6': 3, '3k2': 0, '6k4': -1 } },
            { id: 'DLY', name: 'Analog Delay', on: true, params: { time: 450, feedback: 35, mix: 22 } },
            { id: 'REV', name: 'Large Hall', on: true, params: { decay: 2.5, mix: 15 } }
        ];
    } else {
        const model = (songId === 'whiteroom') ? "UK 800" : "USA Clean";
        chain = [
            { id: 'PRE', name: 'Comp', on: true, params: { sustain: 40 } },
            { id: 'AMP', name: model, on: true, mode: 'STD', params: { gain: 30, bass: 50, mid: 40, tre: 60 } },
            { id: 'CAB', name: '2x12 Silver', on: true, params: { hicut: 8.0 } },
            { id: 'REV', name: 'Room', on: true, params: { decay: 1.2, mix: 10 } }
        ];
    }
    return chain;
}

function renderEditor() {
    const container = document.getElementById('main-content');
    const song = songDatabase.find(s => s.id === state.activeSong);
    if (!song) return;
    container.innerHTML = `
        <div style="padding:15px; border-bottom:1px solid #222;">
            <h2 style="margin:0; font-size:1.1rem;">${song.title}</h2>
            <small style="color:#666;">Sezione: ${state.activeSection}</small>
        </div>
        ${state.activeChain.map((mod, idx) => `
            <div class="module-block ${mod.on ? 'on' : ''} ${mod.mode === 'NAM' ? 'nam-mode' : ''}" onclick="editModule(${idx})">
                <div><strong>${mod.id}</strong><br><small>${mod.name}</small></div>
                <div onclick="event.stopPropagation(); toggleModule(${idx})">${mod.on ? 'ON' : 'OFF'}</div>
            </div>
        `).join('')}
    `;
    updateStatusBar();
}

let editingIdx = null;
function editModule(idx) {
    editingIdx = idx;
    const mod = state.activeChain[idx];
    const sheet = document.getElementById('module-sheet');
    const container = document.getElementById('params-container');
    document.getElementById('sheet-title').innerText = mod.id;

    let html = "";
    if (mod.id === 'AMP') {
        html = renderAmpModule(mod);
    } else if (mod.id === 'EQ') {
        html = `<div class="eq-container">` + Object.entries(mod.params).map(([b, v]) => `
            <div class="eq-fader-wrap">
                <span class="eq-val">${v}</span>
                <input type="range" class="eq-fader" min="-12" max="12" step="0.5" value="${v}" oninput="this.previousElementSibling.innerText=this.value">
                <span class="eq-label">${b}</span>
            </div>`).join('') + `</div>`;
    } else {
        html = Object.entries(mod.params).map(([k, v]) => renderSlider(k, v)).join('');
    }
    
    container.innerHTML = html;
    sheet.classList.add('open');
}

function renderAmpModule(mod) {
    const isNAM = mod.mode === 'NAM';
    let html = `<div class="mode-switcher">
        <button class="${!isNAM?'active':''}" onclick="switchAmpMode('STD')">MODELS</button>
        <button class="${isNAM?'active nam-mode':''}" onclick="switchAmpMode('NAM')">SNAPTONE/NAM</button>
    </div>`;
    
    if (isNAM) {
        const p = mod.params;
        html += `<div class="param-row"><label>PROFILO NAM</label>
        <select id="nam-sel" style="width:100%; background:#222; color:#fff; padding:10px; border:1px solid #444; border-radius:6px; margin-bottom:15px;">
            ${namProfiles.map(p => `<option value="${p.id}" ${mod.params.profile==p.id?'selected':''}>${p.name}</option>`).join('')}
        </select></div>`;
        html += renderSlider('Gain Trim', p.gainTrim, -6, 6, 0.5, "dB");
        html += renderSlider('Tone', p.tone, -5, 5, 0.5);
        html += renderSlider('Level', p.level, 0, 100, 1, "dB");
    } else {
        const p = mod.params;
        html += `<div class="param-row"><label>MODELLO GP-5</label>
        <select id="amp-sel" style="width:100%; background:#222; color:#fff; padding:10px; border:1px solid #444; border-radius:6px; margin-bottom:15px;">
            ${AMP_MODELS_GP5.map(m => `<option value="${m}" ${mod.name==m?'selected':''}>${m}</option>`).join('')}
        </select></div>`;
        html += renderSlider('Gain', p.gain);
        html += renderSlider('Bass', p.bass);
        html += renderSlider('Mid', p.mid);
        html += renderSlider('Treble', p.tre);
    }
    return html;
}

function switchAmpMode(mode) {
    const mod = state.activeChain[editingIdx];
    mod.mode = mode;
    mod.name = (mode === 'NAM') ? "SnapTone / NAM" : "USA Clean";
    editModule(editingIdx);
}

function applyModuleChanges() {
    const mod = state.activeChain[editingIdx];
    const ampSel = document.getElementById('amp-sel');
    if (ampSel) mod.name = ampSel.value;
    const namSel = document.getElementById('nam-sel');
    if (namSel) mod.params.profile = namSel.value;
    
    const inputs = document.querySelectorAll('#params-container input[type=range]:not(.eq-fader)');
    inputs.forEach(input => {
        const key = input.previousElementSibling.querySelector('label').innerText.toLowerCase().replace(" ", "");
        mod.params[key] = parseFloat(input.value);
    });

    const faders = document.querySelectorAll('.eq-fader');
    if (faders.length > 0) {
        faders.forEach(f => mod.params[f.nextElementSibling.innerText] = parseFloat(f.value));
    }

    closeSheet(); renderEditor(); saveState();
}

function toggleModule(idx) {
    state.activeChain[idx].on = !state.activeChain[idx].on;
    if (state.currentView === 'performance') renderPerformance(); else renderEditor();
    updateStatusBar();
}

function renderPerformance() {
    const container = document.getElementById('main-content');
    container.innerHTML = `<div id="perf-view">
        <button class="perf-btn ${state.activeSection==='Verse'?'active':''}" onclick="perfSwitch('Verse')">VERSE</button>
        <button class="perf-btn ${state.activeSection==='Chorus'?'active':''}" onclick="perfSwitch('Chorus')">CHORUS</button>
        <button class="perf-btn ${state.activeSection==='Solo'?'active':''}" onclick="perfSwitch('Solo')">SOLO</button>
        <button onclick="toggleLock()" style="padding:15px; background:#222; border:none; color:#666; border-radius:8px;">LOCK UI</button>
    </div>`;
}

function perfSwitch(sec) {
    if (state.isLocked) return;
    state.activeSection = sec;
    state.activeChain = getPresetFor(state.activeSong, sec, state.currentGuitar);
    renderPerformance(); updateStatusBar(); saveState();
}

function toggleLock() { state.isLocked = true; document.getElementById('ui-lock-overlay').classList.add('active'); }
function handleLockTap() {
    const p = document.getElementById('lock-progress'); p.style.width = '100%';
    state.lockTimer = setTimeout(() => {
        state.isLocked = false; document.getElementById('ui-lock-overlay').classList.remove('active');
        p.style.width = '0%';
    }, 1500);
}

window.onmouseup = () => { clearTimeout(state.lockTimer); document.getElementById('lock-progress').style.width = '0%'; };

function openTuner() {
    state.tunerActive = true;
    document.body.insertAdjacentHTML('beforeend', `<div id="tuner-screen">
        <div class="note-main">E</div>
        <div class="needle-container"><div id="needle"></div></div>
        <button onclick="this.parentElement.remove(); state.tunerActive=false;" style="margin-top:40px; padding:10px 30px;">EXIT</button>
    </div>`);
    loopTuner();
}

function loopTuner() {
    if (!state.tunerActive) return;
    const n = document.getElementById('needle');
    const v = (Math.random() * 10 - 5);
    n.style.transform = `translateX(-50%) rotate(${v*4}deg)`;
    setTimeout(loopTuner, 100);
}

function closeSheet() { document.getElementById('module-sheet').classList.remove('open'); }
function updateStatusBar() {
    const count = state.activeChain.filter(m => m.on).length;
    document.getElementById('status-bar').innerText = `MOD: ${count}/11 | 120 BPM | ${state.currentGuitar.toUpperCase()}`;
}
function saveState() { localStorage.setItem('gp5_sim_state', JSON.stringify(state)); }
function loadState() { const s = localStorage.getItem('gp5_sim_state'); if(s) state = JSON.parse(s); }

init();
