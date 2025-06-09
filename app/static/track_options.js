// Handle selecting existing games for tracking
document.addEventListener('DOMContentLoaded', async () => {
  // Setup game select modal
  const gameSelectBtn = document.getElementById('select-existing-btn');
  const gameSearchInput = document.getElementById('game-search');
  const gamesList = document.getElementById('games-list');
  
  if (gameSelectBtn) {
    gameSelectBtn.addEventListener('click', () => {
      loadGames();
      const modal = new bootstrap.Modal(document.getElementById('gameSelectModal'));
      modal.show();
    });
  }
  
  if (gameSearchInput) {
    gameSearchInput.addEventListener('input', () => {
      const query = gameSearchInput.value.toLowerCase();
      const items = gamesList.querySelectorAll('.list-group-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }
  
  // Load games for selection
  async function loadGames() {
    try {
      const games = await fetch('/api/games').then(r => r.json());
      const players = await fetch('/api/players').then(r => r.json());
      
      if (games.length === 0) {
        gamesList.innerHTML = '<div class="text-center text-muted py-3">No games found.</div>';
        return;
      }
      
      let html = '';
      for (const game of games) {
        const date = new Date(game.date).toLocaleDateString();
        
        // Get player names for teams
        const team1Names = game.team1.map(id => {
          const player = players.find(p => p.id === id);
          return player ? player.name : 'Unknown';
        }).join(', ');
        
        const team2Names = game.team2.map(id => {
          const player = players.find(p => p.id === id);
          return player ? player.name : 'Unknown';
        }).join(', ');
        
        // Format score
        const score = game.score || '0-0';
        
        html += `
          <a href="/tracking/${game.id}" class="list-group-item list-group-item-action">
            <div class="d-flex justify-content-between align-items-center">
              <strong>${date}</strong>
              <span class="badge bg-primary rounded-pill">${score}</span>
            </div>
            <div class="mt-1">
              <small class="text-muted">${team1Names} vs ${team2Names}</small>
            </div>
          </a>
        `;
      }
      
      gamesList.innerHTML = html;
    } catch (error) {
      gamesList.innerHTML = '<div class="alert alert-danger">Error loading games</div>';
      console.error(error);
    }
  }
});
