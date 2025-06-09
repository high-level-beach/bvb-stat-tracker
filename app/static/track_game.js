// JS for Stat Tracking Page: Fast entry for all categories, supports editing existing games
// On load: fetch game info, players, and existing stats
// Render teams, stat entry UI, and stat history
// Allow undo/redo, and ending the game

document.addEventListener('DOMContentLoaded', async () => {
  const gameId = parseInt(document.body.dataset.gameId || document.querySelector('[game_id]')?.getAttribute('game_id'));
  if (!gameId) return;

  // Fetch game and player info
  const game = await fetch(`/api/games/${gameId}`).then(r => r.json());
  const players = await fetch('/api/players').then(r => r.json());
  let stats = await fetch(`/api/games/${gameId}/stats`).then(r => r.json()).catch(() => []);

  // Render game meta
  document.getElementById('game-meta').innerHTML = `<strong>Date:</strong> ${game.date} <br><strong>Score:</strong> ${game.score || '0-0'}`;

  // Render teams
  function renderTeams() {
    const t1 = game.team1.map(pid => players.find(p => p.id === pid)?.name || '?').join(', ');
    const t2 = game.team2.map(pid => players.find(p => p.id === pid)?.name || '?').join(', ');
    document.getElementById('teams-container').innerHTML = `<div><b>Team 1:</b> ${t1}</div><div><b>Team 2:</b> ${t2}</div>`;
  }
  renderTeams();

  // Set up player selection
  const allPlayers = [
    ...game.team1.map(pid => players.find(p => p.id === pid)),
    ...game.team2.map(pid => players.find(p => p.id === pid))
  ].filter(Boolean);

  // Stat entry UI
  function renderStatEntry() {
    // Fast entry for all categories
    const categories = [
      { key: 'serve', label: 'Serve', actions: ['In', 'Miss', 'Ace'] },
      { key: 'receive', label: 'Receive', actions: ['Good', 'Error'] },
      { key: 'attack', label: 'Attack', actions: ['Kill', 'Error', 'Blocked'] },
      { key: 'block', label: 'Block', actions: ['Stuff', 'Touch', 'Miss'] },
      { key: 'dig', label: 'Dig', actions: ['Good', 'Error'] },
      { key: 'set', label: 'Set', actions: ['Good', 'Error'] },
    ];
    
    const container = document.getElementById('stat-entry-container');
    let categoriesHtml = '';
    
    categories.forEach(cat => {
      // Only show the first category by default, others will be hidden
      const display = cat.key === 'serve' ? '' : 'none';
      
      categoriesHtml += `
        <div id="${cat.key}-category" class="stat-category mb-3" style="display: ${display}">
          <h5>${cat.label}</h5>
          <div class="d-flex flex-wrap mb-2">
            ${allPlayers.map(p => `
              <div class="me-2 mb-2">
                <button class="btn btn-outline-secondary player-select" data-player-id="${p.id}">
                  ${p.name}
                </button>
              </div>
            `).join('')}
          </div>
          <div class="d-flex flex-wrap">
            ${cat.actions.map(action => `
              <button class="btn btn-outline-primary action-btn" 
                data-category="${cat.key}" 
                data-action="${action}">
                ${action}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    // Category tabs for switching between stat types
    const tabs = `
      <div class="nav nav-pills mb-3">
        ${categories.map(cat => `
          <button class="nav-link ${cat.key === 'serve' ? 'active' : ''}" 
            data-category="${cat.key}">
            ${cat.label}
          </button>
        `).join('')}
      </div>
    `;
    
    container.innerHTML = tabs + categoriesHtml + container.innerHTML;
    
    // Category tab click handlers
    container.querySelectorAll('.nav-link').forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        
        // Update active tab
        container.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide categories
        categories.forEach(cat => {
          const elem = document.getElementById(`${cat.key}-category`);
          elem.style.display = cat.key === category ? '' : 'none';
        });
      });
    });
    
    // Toggle All button functionality
    document.getElementById('toggle-all-btn').addEventListener('click', function() {
      const allHidden = categories.some(cat => 
        document.getElementById(`${cat.key}-category`).style.display === 'none'
      );
      
      if (allHidden) {
        // Show all categories
        categories.forEach(cat => {
          document.getElementById(`${cat.key}-category`).style.display = '';
        });
        this.textContent = 'Hide Categories';
        container.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
      } else {
        // Hide all except active tab
        const activeCategory = container.querySelector('.nav-link.active')?.dataset.category || 'serve';
        categories.forEach(cat => {
          document.getElementById(`${cat.key}-category`).style.display = 
            cat.key === activeCategory ? '' : 'none';
        });
        this.textContent = 'Show All Categories';
      }
    });
    
    // Player selection 
    let selectedPlayerId = null;
    container.querySelectorAll('.player-select').forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect all players
        container.querySelectorAll('.player-select').forEach(b => 
          b.classList.replace('btn-primary', 'btn-outline-secondary'));
        
        // Select this player
        btn.classList.replace('btn-outline-secondary', 'btn-primary');
        selectedPlayerId = parseInt(btn.dataset.playerId);
      });
    });
    
    // Action button click handlers
    container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!selectedPlayerId) {
          alert("Please select a player first");
          return;
        }
        
        const category = btn.dataset.category;
        const action = btn.dataset.action;
        
        // Create the stat object based on category and action
        const statPayload = createStatObject(category, action, selectedPlayerId);
        try {
          // Send to API (normalized schema)
          const response = await fetch(`/api/games/${gameId}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statPayload)
          });
          if (!response.ok) throw new Error('Failed to save stat');
          // Add to stats array
          const newStat = await response.json();
          stats.push(newStat);
          // Update history
          renderStatHistory();
          // Enable undo button
          document.getElementById('undo-btn').disabled = false;
        } catch (error) {
          console.error('Error recording stat:', error);
          alert('Failed to record stat. Please try again.');
        }
      });
    });
  }
  
  // Create stat object based on category and action
  function createStatObject(category, action, playerId) {
    const now = new Date().toISOString();
    // Always build the normalized payload: { base_stat: {...}, <detail>_stat: {...} }
    const base_stat = {
      player_id: playerId,
      game_id: gameId,
      timestamp: now,
      // Set action_type based on category
      action_type: {
        'serve': 'serving',
        'receive': 'serve_receive',
        'attack': 'attack',
        'block': 'block',
        'dig': 'dig',
        'set': 'set',
      }[category]
    };

    let detail = {};
    switch (category) {
      case 'serve':
        detail = {
          is_ace: action === 'Ace',
          is_missed: action === 'Miss',
          // TODO: add serve_type, serve_target, opponent_pass_quality if UI supports
        };
        return { base_stat, serve_stat: detail };
      case 'receive':
        detail = {
          is_good_pass: action === 'Good',
          is_error: action === 'Error',
          // TODO: add pass_rating if UI supports
        };
        return { base_stat, receive_stat: detail };
      case 'attack':
        detail = {
          is_kill: action === 'Kill',
          is_error: action === 'Error',
          is_blocked: action === 'Blocked',
          // TODO: add attack_type, attack_direction if UI supports
        };
        return { base_stat, attack_stat: detail };
      case 'block':
        detail = {
          is_stuff: action === 'Stuff',
          is_touch: action === 'Touch',
        };
        return { base_stat, block_stat: detail };
      case 'dig':
        detail = {
          is_successful: action === 'Good',
          // TODO: add led_to_kill, dig_quality if UI supports
        };
        return { base_stat, dig_stat: detail };
      case 'set':
        detail = {
          is_killable: action === 'Good',
          is_error: action === 'Error',
          // TODO: add set_type if UI supports
        };
        return { base_stat, set_stat: detail };
      default:
        return { base_stat };
    }
  }

  // Render stat history
  function renderStatHistory() {
    const historyContainer = document.getElementById('stat-history');
    if (stats.length === 0) {
      historyContainer.innerHTML = '<div class="text-center text-muted py-3">No stats recorded</div>';
      return;
    }
    // Sort by timestamp, newest first
    stats.sort((a, b) => new Date((b.base?.timestamp) || b.timestamp) - new Date((a.base?.timestamp) || a.timestamp));
    let html = '';
    stats.forEach(stat => {
      // New API: stat = { base: {...}, details: {...} }
      const base = stat.base || stat.base_stat || stat; // fallback for legacy
      const details = stat.details || stat.serve_stat || stat.receive_stat || stat.attack_stat || stat.block_stat || stat.dig_stat || stat.set_stat || {};
      const player = players.find(p => p.id === base.player_id);
      const playerName = player ? player.name : 'Unknown Player';
      let statType = '';
      let statAction = '';
      switch (base.action_type) {
        case 'serving':
          statType = 'Serve';
          statAction = details.is_ace ? 'Ace' : details.is_missed ? 'Miss' : 'In';
          break;
        case 'serve_receive':
          statType = 'Receive';
          statAction = details.is_good_pass ? 'Good' : details.is_error ? 'Error' : 'Normal';
          break;
        case 'attack':
          statType = 'Attack';
          statAction = details.is_kill ? 'Kill' : details.is_error ? 'Error' : details.is_blocked ? 'Blocked' : 'Normal';
          break;
        case 'block':
          statType = 'Block';
          statAction = details.is_stuff ? 'Stuff' : details.is_touch ? 'Touch' : 'Miss';
          break;
        case 'dig':
          statType = 'Dig';
          statAction = details.is_successful ? 'Good' : 'Error';
          break;
        case 'set':
          statType = 'Set';
          statAction = details.is_killable ? 'Good' : details.is_error ? 'Error' : 'Normal';
          break;
        default:
          statType = 'Unknown';
          statAction = 'Unknown';
      }
      html += `
        <div class="history-entry py-1 border-bottom">
          <div>
            <span><strong>${playerName}</strong>: ${statType} - ${statAction}</span>
          </div>
        </div>
      `;
    });
    historyContainer.innerHTML = html;
  }

  // Initialize UI components
  renderStatEntry();
  renderStatHistory();

  // Undo button functionality
  document.getElementById('undo-btn').addEventListener('click', async () => {
    if (stats.length === 0) return;
    
    try {
      // Get the latest stat
      const latestStat = stats.reduce((latest, stat) => {
        return new Date(stat.timestamp) > new Date(latest.timestamp) ? stat : latest;
      }, stats[0]);
      
      // Delete from API
      const response = await fetch(`/api/games/${gameId}/stats/${latestStat.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete stat');
      
      // Remove from stats array
      stats = stats.filter(s => s.id !== latestStat.id);
      
      // Update history
      renderStatHistory();
      
      // Disable undo button if no more stats
      if (stats.length === 0) {
        document.getElementById('undo-btn').disabled = true;
      }
    } catch (error) {
      console.error('Error deleting stat:', error);
      alert('Failed to undo last stat. Please try again.');
    }
  });
  
  // End game button
  document.getElementById('end-game-btn').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to end tracking this game?');
    if (confirmed) {
      window.location.href = '/';
    }
  });
});
