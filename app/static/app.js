// Beach Volleyball Stats Tracker - Frontend JS
// Handles UI logic and API calls

const API_BASE = '';

// --- DOM Elements ---
const gameForm = document.getElementById('game-form');
const playerForm = document.getElementById('player-form');
const statForm = document.getElementById('stat-form');
const gameSelect = document.getElementById('game-select');
const playerList = document.getElementById('player-list');
const statPlayerSelect = document.getElementById('stat-player');
const statActionSelect = document.getElementById('stat-action');
const actionFields = document.getElementById('action-fields');
const summaryPlayerSelect = document.getElementById('summary-player-select');
const statsSummary = document.getElementById('stats-summary');
const statEntryFeedback = document.getElementById('stat-entry-feedback');
const refreshGamesBtn = document.getElementById('refresh-games');

// --- Utility ---
function showFeedback(msg, type = 'success') {
    statEntryFeedback.innerHTML = `<div class="alert alert-${type} py-1 my-1">${msg}</div>`;
    setTimeout(() => { statEntryFeedback.innerHTML = ''; }, 1800);
}

function clearForm(form) {
    form.reset();
}

function optionEl(val, text) {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = text;
    return o;
}

// --- API Calls ---
async function api(url, options = {}) {
    const resp = await fetch(API_BASE + url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
}

// --- Game Management ---
async function loadGames() {
    const games = await api('/api/games/');
    gameSelect.innerHTML = '';
    games.forEach(g => {
        const opt = optionEl(g.id, `${g.my_team} vs ${g.opponent_team} (${g.date})`);
        gameSelect.appendChild(opt);
    });
    if (games.length > 0) gameSelect.value = games[0].id;
    await loadSummaryPlayers();
}

gameForm.onsubmit = async e => {
    e.preventDefault();
    const data = {
        my_team: gameForm['my-team'].value,
        opponent_team: gameForm['opponent-team'].value,
        date: gameForm['game-date'].value,
        num_sets: parseInt(gameForm['num-sets'].value)
    };
    await api('/api/games/', { method: 'POST', body: JSON.stringify(data) });
    showFeedback('Game created!');
    clearForm(gameForm);
    await loadGames();
};

refreshGamesBtn.onclick = loadGames;

gameSelect.onchange = () => {
    loadSummaryPlayers();
    renderStatsSummary();
};

// --- Player Management ---
async function loadPlayers() {
    const players = await api('/api/players/');
    playerList.innerHTML = '';
    statPlayerSelect.innerHTML = '';
    summaryPlayerSelect.innerHTML = '';
    players.forEach(p => {
        // List
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = p.name;
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger btn-sm';
        delBtn.textContent = '✕';
        delBtn.onclick = async () => {
            await api(`/api/players/${p.id}`, { method: 'DELETE' });
            await loadPlayers();
        };
        li.appendChild(delBtn);
        playerList.appendChild(li);
        // Stat select
        statPlayerSelect.appendChild(optionEl(p.id, p.name));
        summaryPlayerSelect.appendChild(optionEl(p.id, p.name));
    });
}

playerForm.onsubmit = async e => {
    e.preventDefault();
    const name = playerForm['player-name'].value.trim();
    if (!name) return;
    await api('/api/players/', { method: 'POST', body: JSON.stringify({ name }) });
    showFeedback('Player added!');
    clearForm(playerForm);
    await loadPlayers();
};

// --- Stat Entry ---
const actionTemplates = {
    serving: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Missed?</label>
                <select class="form-select" name="is_missed_serve">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Ace?</label>
                <select class="form-select" name="is_ace">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Target</label>
                <input type="text" class="form-control" name="serve_target" placeholder="Player A/B">
            </div>
            <div class="col">
                <label class="form-label">Opp. Pass Quality</label>
                <select class="form-select" name="opponent_pass_quality">
                    <option value="">-</option>
                    <option value="0">Bad</option>
                    <option value="1">OK</option>
                    <option value="2">Perfect</option>
                </select>
            </div>
        </div>`,
    serve_receive: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Good Pass?</label>
                <select class="form-select" name="is_good_pass">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Error?</label>
                <select class="form-select" name="is_receive_error">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        </div>`,
    attack: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Kill?</label>
                <select class="form-select" name="is_kill">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Error?</label>
                <select class="form-select" name="is_attack_error">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Blocked?</label>
                <select class="form-select" name="is_blocked">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Direction</label>
                <select class="form-select" name="attack_direction">
                    <option value="">-</option>
                    <option value="line">Line</option>
                    <option value="angle">Angle</option>
                    <option value="cut">Cut</option>
                    <option value="jumbo">Jumbo</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Type</label>
                <select class="form-select" name="attack_type">
                    <option value="">-</option>
                    <option value="hard">Hard</option>
                    <option value="roll">Roll</option>
                    <option value="tip">Tip</option>
                </select>
            </div>
        </div>`,
    block: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Stuff Block?</label>
                <select class="form-select" name="is_stuff_block">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Soft Touch?</label>
                <select class="form-select" name="is_soft_touch">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        </div>`,
    dig: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Successful?</label>
                <select class="form-select" name="is_successful_dig">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Led to Kill?</label>
                <select class="form-select" name="dig_led_to_kill">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        </div>`,
    set: `
        <div class="row stat-entry-row">
            <div class="col">
                <label class="form-label">Set Error?</label>
                <select class="form-select" name="is_set_error">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
            <div class="col">
                <label class="form-label">Killable?</label>
                <select class="form-select" name="is_killable_set">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        </div>`
};

function renderActionFields() {
    const type = statActionSelect.value;
    actionFields.innerHTML = actionTemplates[type] || '';
}

statActionSelect.onchange = renderActionFields;
window.addEventListener('DOMContentLoaded', renderActionFields);

// --- Stat Submission ---
statForm.onsubmit = async e => {
    e.preventDefault();
    const player_id = parseInt(statPlayerSelect.value);
    const game_id = parseInt(gameSelect.value);
    const action_type = statActionSelect.value;
    const fields = Object.fromEntries(new FormData(statForm));
    let url = '/api/stats/' + action_type.replace('_', '-');
    let payload = {
        game_id,
        player_id,
        action_type,
        timestamp: Date.now(),
    };
    // Merge action-specific fields
    for (const [k, v] of Object.entries(fields)) {
        if (v === '' || v === undefined) continue;
        if (v === 'true' || v === 'false') payload[k] = v === 'true';
        else if (!isNaN(v) && k !== 'serve_target') payload[k] = v === '' ? null : Number(v);
        else payload[k] = v;
    }
    await api(url + '/', { method: 'POST', body: JSON.stringify(payload) });
    showFeedback('Stat recorded!');
    clearForm(statForm);
    renderActionFields();
    renderStatsSummary();
};

// --- Stats Summary ---
async function loadSummaryPlayers() {
    const players = await api('/api/players/');
    summaryPlayerSelect.innerHTML = '';
    players.forEach(p => summaryPlayerSelect.appendChild(optionEl(p.id, p.name)));
}

summaryPlayerSelect.onchange = renderStatsSummary;
gameSelect.onchange = renderStatsSummary;

async function renderStatsSummary() {
    const player_id = summaryPlayerSelect.value;
    const game_id = gameSelect.value;
    if (!player_id || !game_id) { statsSummary.innerHTML = ''; return; }
    try {
        const summary = await api(`/api/stats/summary/player/${player_id}/game/${game_id}`);
        statsSummary.innerHTML = summaryTableHtml(summary);
    } catch (e) {
        statsSummary.innerHTML = '<div class="text-danger">No stats yet for this player/game.</div>';
    }
}

function summaryTableHtml(summary) {
    if (!summary) return '';
    return `
    <table class="table table-bordered summary-table">
        <thead><tr><th>Category</th><th>Metrics</th></tr></thead>
        <tbody>
            <tr><td>Serving</td><td>
                Total: ${summary.serving.total} | Aces: ${summary.serving.aces} | Errors: ${summary.serving.errors}<br>
                Targets: ${Object.entries(summary.serving.targets).map(([k, v]) => `${k}: ${v}`).join(', ')}<br>
                Opp. Pass Quality: ${Object.entries(summary.serving.opponent_pass_quality).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </td></tr>
            <tr><td>Serve Receive</td><td>
                Total: ${summary.serve_receive.total} | Good Passes: ${summary.serve_receive.good_passes} | Errors: ${summary.serve_receive.errors}
            </td></tr>
            <tr><td>Attacking</td><td>
                Total: ${summary.attack.total} | Kills: ${summary.attack.kills} | Errors: ${summary.attack.errors} | Blocked: ${summary.attack.blocked}<br>
                Directions: ${Object.entries(summary.attack.directions).map(([k, v]) => `${k}: ${v}`).join(', ')}<br>
                Types: ${Object.entries(summary.attack.types).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </td></tr>
            <tr><td>Blocking</td><td>
                Total: ${summary.block.total} | Stuff Blocks: ${summary.block.stuff_blocks} | Soft Touches: ${summary.block.soft_touches}
            </td></tr>
            <tr><td>Digging</td><td>
                Total: ${summary.dig.total} | Successful: ${summary.dig.successful} | Led to Kills: ${summary.dig.led_to_kills}
            </td></tr>
            <tr><td>Setting</td><td>
                Total: ${summary.set.total} | Errors: ${summary.set.errors} | Killable: ${summary.set.killable}
            </td></tr>
        </tbody>
    </table>
    `;
}

// --- Initial Load ---
window.addEventListener('DOMContentLoaded', async () => {
    await loadGames();
    await loadPlayers();
    renderActionFields();
    renderStatsSummary();
});
