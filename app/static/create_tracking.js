// JS for Create Tracking Page
document.addEventListener('DOMContentLoaded', async () => {
  // Get player data
  let players = [];
  try {
    const response = await fetch('/api/players');
    players = await response.json();
  } catch (error) {
    console.error('Error fetching players:', error);
  }

  // Set default date to today
  document.getElementById('game-date').valueAsDate = new Date();
  
  // Track selected players
  const selectedPlayers = {
    team1: [null, null],
    team2: [null, null]
  };
  
  // Player selection modal setup
  const playerModal = new bootstrap.Modal(document.getElementById('playerSelectModal'));
  let currentTeam = null;
  let currentSlot = null;
  const playerList = document.getElementById('player-list');
  const searchInput = document.getElementById('player-search-input');
  
  // Add player button functionality
  document.querySelectorAll('.add-player-btn').forEach(button => {
    button.addEventListener('click', () => {
      // Store which button was clicked
      currentTeam = button.dataset.team;
      currentSlot = button.dataset.slot;
      
      // Clear search input and filter
      searchInput.value = '';
      renderPlayerList(players);
      
      // Show modal
      playerModal.show();
    });
  });
  
  // Search functionality
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filteredPlayers = players.filter(p => 
      p.name.toLowerCase().includes(query)
    );
    renderPlayerList(filteredPlayers);
  });
  
  // Render player selection list
  function renderPlayerList(playerData) {
    // Get all currently selected player IDs
    const allSelectedIds = [
      ...selectedPlayers.team1.filter(Boolean).map(p => p.id),
      ...selectedPlayers.team2.filter(Boolean).map(p => p.id)
    ];
    
    let html = '';
    if (playerData.length === 0) {
      html = '<li class="list-group-item text-center">No players found</li>';
    } else {
      playerData.forEach(player => {
        // Check if player is already selected in any team
        const isSelected = allSelectedIds.includes(player.id);
        const itemClass = isSelected ? 'list-group-item disabled' : 'list-group-item';
        
        html += `
          <li class="${itemClass}" ${isSelected ? '' : `data-id="${player.id}" data-name="${player.name}"`}>
            ${player.name}
            ${isSelected ? '<span class="badge bg-secondary ms-2">Already selected</span>' : ''}
          </li>
        `;
      });
    }
    playerList.innerHTML = html;
    
    // Add click event to selectable players
    playerList.querySelectorAll('.list-group-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', () => {
        selectPlayer(
          parseInt(item.dataset.id),
          item.dataset.name
        );
        playerModal.hide();
      });
    });
  }
  
  // Select a player
  function selectPlayer(playerId, playerName) {
    // Set the selected player
    selectedPlayers[`team${currentTeam}`][currentSlot] = {
      id: playerId,
      name: playerName
    };
    
    // Update button text and style
    const button = document.querySelector(`.add-player-btn[data-team="${currentTeam}"][data-slot="${currentSlot}"]`);
    button.innerHTML = `<i class="bi bi-person-check me-2"></i> ${playerName}`;
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-outline-success');
  }
  
  // Form submission
  document.getElementById('create-tracking-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.getElementById('create-tracking-feedback');
    
    // Validate that all players are selected
    if (selectedPlayers.team1.includes(null) || selectedPlayers.team2.includes(null)) {
      feedback.innerHTML = '<div class="alert alert-danger">All player positions must be filled</div>';
      return;
    }
    
    // Prepare game data
    const gameData = {
      date: document.getElementById('game-date').value,
      team1: selectedPlayers.team1.map(p => p.id),
      team2: selectedPlayers.team2.map(p => p.id),
      score: "0-0"
    };
    
    try {
      // Send POST request to create game
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newGame = await response.json();
      
      // Redirect to track game page
      window.location.href = `/tracking/${newGame.id}`;
    } catch (error) {
      console.error('Error creating game:', error);
      feedback.innerHTML = `<div class="alert alert-danger">Error creating game: ${error.message}</div>`;
    }
  });
});
