// home.js - JS for Beach Volleyball Stats Tracker Home Page

const homeGameForm = document.getElementById('home-game-form');
const homeGameFeedback = document.getElementById('home-game-feedback');

function showHomeFeedback(msg, type = 'success') {
    homeGameFeedback.innerHTML = `<div class="alert alert-${type} py-1 my-1">${msg}</div>`;
    setTimeout(() => { homeGameFeedback.innerHTML = ''; }, 2000);
}

const team1Select = document.getElementById('home-team1');
const team2Select = document.getElementById('home-team2');

async function loadPlayerOptions() {
    try {
        const resp = await fetch('/api/players/');
        if (!resp.ok) throw new Error(await resp.text());
        const players = await resp.json();
        team1Select.innerHTML = '';
        team2Select.innerHTML = '';
        players.forEach(p => {
            const opt1 = document.createElement('option');
            opt1.value = p.id;
            opt1.textContent = p.name;
            team1Select.appendChild(opt1);
            const opt2 = document.createElement('option');
            opt2.value = p.id;
            opt2.textContent = p.name;
            team2Select.appendChild(opt2);
        });
    } catch (e) {
        showHomeFeedback('Error loading players', 'danger');
    }
}

// Load players when modal is shown
const createGameModal = document.getElementById('createGameModal');
if (createGameModal) {
    createGameModal.addEventListener('show.bs.modal', loadPlayerOptions);
}

if (homeGameForm) {
    homeGameForm.onsubmit = async (e) => {
        e.preventDefault();
        const date = document.getElementById('home-game-date').value;
        const team1 = Array.from(team1Select.selectedOptions).map(opt => parseInt(opt.value));
        const team2 = Array.from(team2Select.selectedOptions).map(opt => parseInt(opt.value));
        // Validation
        if (team1.length !== 2 || team2.length !== 2) {
            showHomeFeedback('Select exactly 2 players for each team.', 'danger');
            return;
        }
        if (team1.some(id => team2.includes(id))) {
            showHomeFeedback('A player cannot be on both teams.', 'danger');
            return;
        }
        try {
            const data = {
                date,
                team1,
                team2
            };
            const resp = await fetch('/api/games/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!resp.ok) throw new Error(await resp.text());
            const game = await resp.json();
            showHomeFeedback('Game created!', 'success');
            setTimeout(() => {
                window.location.href = `/games/${game.id}`;
            }, 900);
        } catch (err) {
            showHomeFeedback('Error: ' + err.message, 'danger');
        }
    };
}
