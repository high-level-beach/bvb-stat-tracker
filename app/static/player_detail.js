// Helper to get player ID from URL
function getPlayerId() {
    const match = window.location.pathname.match(/\/players\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

async function fetchPlayerDetail(playerId) {
    const resp = await fetch(`/api/players/${playerId}/stats`);
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
}

function renderStats(stats) {
    const container = document.getElementById('player-stats-container');
    if (!stats) {
        container.innerHTML = '<div class="alert alert-danger">No stats found for this player.</div>';
        return;
    }
    let html = '';
    for (const [category, catStats] of Object.entries(stats.categories)) {
        html += `<div class="mb-4">
            <h5 class="text-primary text-uppercase">${category.replace(/_/g, ' ')}</h5>
            <table class="table table-bordered table-sm">
                <tbody>`;
        for (const [stat, value] of Object.entries(catStats)) {
            html += `<tr><td>${stat.replace(/_/g, ' ')}</td><td>${value}</td></tr>`;
        }
        html += '</tbody></table></div>';
    }
    container.innerHTML = html;
}

async function main() {
    const playerId = getPlayerId();
    if (!playerId) return;
    try {
        // Fetch player info
        const resp = await fetch(`/api/players/${playerId}`);
        if (!resp.ok) throw new Error(await resp.text());
        const player = await resp.json();
        document.getElementById('player-name').textContent = player.name;
        document.getElementById('player-meta').textContent = `ID: ${player.id}`;
        // Fetch summary stats
        let summary = {};
        try {
            const sumResp = await fetch('/api/players/summary');
            if (sumResp.ok) {
                const all = await sumResp.json();
                summary = all.find(p => p.id === playerId) || {};
            }
        } catch {}
        let summaryHtml = '';
        if (summary) {
            summaryHtml = `<span class="me-3"><b>Games Played:</b> ${summary.games_played ?? 0}</span>` +
                `<span class="me-3"><b>Kills:</b> ${summary.total_kills ?? 0}</span>` +
                `<span class="me-3"><b>Aces:</b> ${summary.total_aces ?? 0}</span>`;
        }
        document.getElementById('player-summary').innerHTML = summaryHtml;
        // Detailed stats
        const stats = await fetchPlayerDetail(playerId);
        // Render Serving tab
        const serving = (stats.categories && stats.categories.serving) || {};
        const total_serves = serving.total_serves ?? 0;
        const missed_serves = serving.missed_serves ?? 0;
        const aces = serving.aces ?? 0;
        document.getElementById('serving-stats').innerHTML = `
          <table class="table table-sm w-auto">
            <tbody>
              <tr><th>Total Serves</th><td>${total_serves}</td></tr>
              <tr><th>Missed Serves</th><td>${missed_serves}</td></tr>
              <tr><th>Aces</th><td>${aces}</td></tr>
            </tbody>
          </table>
        `;
        // Chart toggle and canvas
        document.getElementById('serving-stats').innerHTML += `
          <div class="d-flex align-items-center mt-4 mb-2">
            <span class="me-2">Chart mode:</span>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="serving-chart-toggle">
              <label class="form-check-label" for="serving-chart-toggle">Percentage</label>
            </div>
          </div>
          <canvas id="servingChart" height="200"></canvas>
        `;
        // Prepare chart data
        const daily = {};
        if (stats.categories && stats.categories.serving_by_date) {
          Object.entries(stats.categories.serving_by_date).forEach(([date, d]) => {
            daily[date] = {
              total: d.total_serves ?? 0,
              misses: d.missed_serves ?? 0,
              aces: d.aces ?? 0,
            };
          });
        }
        // Fallback: if no data, show today with zeros
        if (Object.keys(daily).length === 0) {
          const today = new Date().toISOString().slice(0,10);
          daily[today] = { total: 0, misses: 0, aces: 0 };
        }
        const dates = Object.keys(daily).sort();
        const chartMisses = dates.map(d => daily[d].misses);
        const chartAces = dates.map(d => daily[d].aces);
        const chartOthers = dates.map(d => Math.max(0, daily[d].total - daily[d].misses - daily[d].aces));
        let chartMode = 'count';
        let chart;
        function renderChart() {
          let dataMisses = chartMisses.slice();
          let dataAces = chartAces.slice();
          let dataOthers = chartOthers.slice();
          if (chartMode === 'percent') {
            dataMisses = dates.map((d, i) => daily[d].total ? chartMisses[i]/daily[d].total*100 : 0);
            dataAces = dates.map((d, i) => daily[d].total ? chartAces[i]/daily[d].total*100 : 0);
            dataOthers = dates.map((d, i) => daily[d].total ? chartOthers[i]/daily[d].total*100 : 0);
          }
          if (chart) chart.destroy();
          chart = new Chart(document.getElementById('servingChart').getContext('2d'), {
            type: 'bar',
            data: {
              labels: dates,
              datasets: [
                { label: 'Misses', data: dataMisses, backgroundColor: '#dc3545', stack: 's' },
                { label: 'Aces', data: dataAces, backgroundColor: '#198754', stack: 's' },
                { label: 'Other', data: dataOthers, backgroundColor: '#0d6efd', stack: 's' },
              ]
            },
            options: {
              responsive: true,
              plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, title: { display: true, text: chartMode === 'count' ? 'Serves' : '% of Serves' }, max: chartMode === 'percent' ? 100 : undefined }
              }
            }
          });
        }
        setTimeout(renderChart, 0);
        document.getElementById('serving-chart-toggle').addEventListener('change', function() {
          chartMode = this.checked ? 'percent' : 'count';
          renderChart();
        });
        // (Other tabs can be filled in later)

    } catch (e) {
        document.getElementById('player-stats-container').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

main();
