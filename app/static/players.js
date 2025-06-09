document.addEventListener('DOMContentLoaded', async function() {
    const tableContainer = document.getElementById('players-table-container');

    function renderTable(players) {
    if (!players.length) {
        tableContainer.innerHTML = '<div class="alert alert-info">No players found.</div>';
        return;
    }
    let html = `<table class="table table-striped align-middle">
        <thead>
            <tr>
                <th>Name</th>
                <th>Games Played</th>
                <th>Total Kills</th>
                <th>Total Aces</th>
            </tr>
        </thead>
        <tbody>`;
    for (const p of players) {
        html += `<tr data-player-id="${p.id}" class="player-row">
            <td class="position-relative player-name-cell">
                <a href="/players/${p.id}" class="text-decoration-none text-dark">${p.name}</a>
                <span class="icon-group" style="display:none; position:absolute; right:0; top:50%; transform:translateY(-50%);">
                    <i class="bi bi-pencil-square edit-player-icon" title="Edit" style="cursor:pointer; margin-right:8px;"></i>
                    <i class="bi bi-trash delete-player-icon" title="Delete" style="cursor:pointer;"></i>
                </span>
            </td>
            <td>${p.games_played ?? 0}</td>
            <td>${p.total_kills ?? 0}</td>
            <td>${p.total_aces ?? 0}</td>
        </tr>`;
    }
    html += '</tbody></table>';
    tableContainer.innerHTML = html;

    // Show/hide icons on hover
    document.querySelectorAll('.player-row').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.querySelector('.icon-group').style.display = 'inline';
        });
        row.addEventListener('mouseleave', () => {
            row.querySelector('.icon-group').style.display = 'none';
        });
    });

    // Edit icon click
    document.querySelectorAll('.edit-player-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = icon.closest('.player-row');
            const playerId = row.getAttribute('data-player-id');
            const playerName = row.querySelector('span').innerText;
            showEditPlayerModal(playerId, playerName);
        });
    });
    // Delete icon click
    document.querySelectorAll('.delete-player-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = icon.closest('.player-row');
            const playerId = row.getAttribute('data-player-id');
            const playerName = row.querySelector('span').innerText;
            showDeletePlayerModal(playerId, playerName);
        });
    });
}

// Edit Player Modal logic
const editPlayerModal = document.getElementById('editPlayerModal');
const editPlayerForm = document.getElementById('edit-player-form');
const editPlayerNameInput = document.getElementById('edit-player-name-input');
const editPlayerFeedback = document.getElementById('edit-player-feedback');
let editPlayerId = null;
const editPlayerImageInput = document.getElementById('edit-player-image-input');
let currentEditImageUrl = null;

function showEditPlayerModal(playerId, playerName) {
    editPlayerId = playerId;
    editPlayerNameInput.value = playerName;
    editPlayerFeedback.textContent = '';
    editPlayerFeedback.className = '';
    // Optionally fetch current image_url for preview (not shown here, but could be added)
    if (editPlayerImageInput) editPlayerImageInput.value = '';
    const modal = new bootstrap.Modal(editPlayerModal);
    modal.show();
}
if (editPlayerForm) {
    editPlayerForm.onsubmit = async function(e) {
        e.preventDefault();
        editPlayerFeedback.textContent = '';
        const name = editPlayerNameInput.value.trim();
        let image_url = null;
        if (!name) {
            editPlayerFeedback.textContent = 'Name is required.';
            editPlayerFeedback.className = 'text-danger';
            return;
        }
        if (editPlayerImageInput && editPlayerImageInput.files && editPlayerImageInput.files[0]) {
            try {
                image_url = await uploadImage(editPlayerImageInput.files[0]);
            } catch (err) {
                editPlayerFeedback.textContent = 'Image upload failed: ' + err.message;
                editPlayerFeedback.className = 'text-danger';
                return;
            }
        }
        try {
            const payload = image_url ? { name, image_url } : { name };
            const resp = await fetch(`/api/players/${editPlayerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg);
            }
            editPlayerFeedback.textContent = 'Player updated!';
            editPlayerFeedback.className = 'text-success';
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(editPlayerModal);
                if (modal) modal.hide();
                editPlayerNameInput.value = '';
                if (editPlayerImageInput) editPlayerImageInput.value = '';
                editPlayerFeedback.textContent = '';
                location.reload();
            }, 700);
        } catch (err) {
            editPlayerFeedback.textContent = err.message.includes('exists') ? 'Player name already exists.' : ('Error: ' + err.message);
            editPlayerFeedback.className = 'text-danger';
        }
    };
}
if (editPlayerModal) {
    editPlayerModal.addEventListener('hidden.bs.modal', () => {
        editPlayerNameInput.value = '';
        editPlayerFeedback.textContent = '';
        editPlayerFeedback.className = '';
    });
}

// Delete Player Modal logic
const deletePlayerModal = document.getElementById('deletePlayerModal');
const deletePlayerMessage = document.getElementById('delete-player-message');
const confirmDeletePlayerBtn = document.getElementById('confirm-delete-player-btn');
let deletePlayerId = null;
function showDeletePlayerModal(playerId, playerName) {
    deletePlayerId = playerId;
    deletePlayerMessage.textContent = `Are you sure you want to delete '${playerName}'? This cannot be undone.`;
    const modal = new bootstrap.Modal(deletePlayerModal);
    modal.show();
}
if (confirmDeletePlayerBtn) {
    confirmDeletePlayerBtn.onclick = async function() {
        if (!deletePlayerId) return;
        confirmDeletePlayerBtn.disabled = true;
        try {
            const resp = await fetch(`/api/players/${deletePlayerId}`, {
                method: 'DELETE'
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg);
            }
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(deletePlayerModal);
                if (modal) modal.hide();
                deletePlayerMessage.textContent = '';
                location.reload();
            }, 500);
        } catch (err) {
            deletePlayerMessage.textContent = err.message.includes('foreign key') ? 'Cannot delete player in use.' : ('Error: ' + err.message);
        }
        confirmDeletePlayerBtn.disabled = false;
    };
}
if (deletePlayerModal) {
    deletePlayerModal.addEventListener('hidden.bs.modal', () => {
        deletePlayerMessage.textContent = '';
        deletePlayerId = null;
    });
}

    try {
        const resp = await fetch('/api/players/summary');
        if (!resp.ok) throw new Error(await resp.text());
        const players = await resp.json();
        renderTable(players);
    } catch (e) {
        tableContainer.innerHTML = `<div class="alert alert-danger">Error loading players: ${e.message}</div>`;
    }
});

const addPlayerForm = document.getElementById('add-player-form');
const addPlayerFeedback = document.getElementById('add-player-feedback');
const addPlayerModal = document.getElementById('addPlayerModal');
const playerNameInput = document.getElementById('player-name-input');

const playerImageInput = document.getElementById('player-image-input');

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch('/api/players/upload-image', {
        method: 'POST',
        body: formData
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    return data.image_url;
}

if (addPlayerForm) {
    addPlayerForm.onsubmit = async function(e) {
        e.preventDefault();
        addPlayerFeedback.textContent = '';
        const name = playerNameInput.value.trim();
        let image_url = null;
        if (!name) {
            addPlayerFeedback.textContent = 'Name is required.';
            addPlayerFeedback.className = 'text-danger';
            return;
        }
        if (playerImageInput && playerImageInput.files && playerImageInput.files[0]) {
            try {
                image_url = await uploadImage(playerImageInput.files[0]);
            } catch (err) {
                addPlayerFeedback.textContent = 'Image upload failed: ' + err.message;
                addPlayerFeedback.className = 'text-danger';
                return;
            }
        }
        try {
            const resp = await fetch('/api/players/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, image_url })
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg);
            }
            // Success
            addPlayerFeedback.textContent = 'Player added!';
            addPlayerFeedback.className = 'text-success';
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(addPlayerModal);
                if (modal) modal.hide();
                playerNameInput.value = '';
                if (playerImageInput) playerImageInput.value = '';
                addPlayerFeedback.textContent = '';
                // Reload player table
                location.reload();
            }, 700);
        } catch (err) {
            addPlayerFeedback.textContent = err.message.includes('exists') ? 'Player name already exists.' : ('Error: ' + err.message);
            addPlayerFeedback.className = 'text-danger';
        }
    };
}

if (addPlayerModal) {
    addPlayerModal.addEventListener('hidden.bs.modal', () => {
        playerNameInput.value = '';
        addPlayerFeedback.textContent = '';
    });
}
