// Standalone Symposium Leaderboard Application Logic

const DEFAULT_SAMPLE_COLLEGES = [
  {
    rank: 1,
    college_name: "PSG College of Technology, Coimbatore",
    short_name: "PSG Tech",
    total_points: 580,
    gold_count: 5,
    silver_count: 3,
    bronze_count: 2,
    total_teams: 12,
    winning_events: ["Prompt Forge (1st)", "Code Triathlon (1st)", "Paper Presentation (1st)", "Project Expo (1st)"]
  },
  {
    rank: 2,
    college_name: "SSN College of Engineering, Chennai",
    short_name: "SSN",
    total_points: 460,
    gold_count: 3,
    silver_count: 4,
    bronze_count: 2,
    total_teams: 10,
    winning_events: ["Bug Hunt Challenge (1st)", "AI Hackathon (1st)", "Counterpoint (1st)"]
  },
  {
    rank: 3,
    college_name: "College of Engineering, Guindy (CEG Anna Univ)",
    short_name: "CEG Chennai",
    total_points: 390,
    gold_count: 2,
    silver_count: 3,
    bronze_count: 5,
    total_teams: 11,
    winning_events: ["Algorithm Sprint (1st)", "Gaming Arena (1st)"]
  },
  {
    rank: 4,
    college_name: "Chennai Institute of Technology (CIT)",
    short_name: "CIT Chennai",
    total_points: 310,
    gold_count: 2,
    silver_count: 2,
    bronze_count: 2,
    total_teams: 8
  },
  {
    rank: 5,
    college_name: "Sri Sairam Engineering College",
    short_name: "Sairam Engg",
    total_points: 260,
    gold_count: 1,
    silver_count: 3,
    bronze_count: 2,
    total_teams: 7
  },
  {
    rank: 6,
    college_name: "Vellore Institute of Technology (VIT)",
    short_name: "VIT Chennai",
    total_points: 220,
    gold_count: 1,
    silver_count: 2,
    bronze_count: 3,
    total_teams: 7
  },
  {
    rank: 7,
    college_name: "SRM Institute of Science and Technology",
    short_name: "SRM IST",
    total_points: 190,
    gold_count: 1,
    silver_count: 1,
    bronze_count: 4,
    total_teams: 6
  },
  {
    rank: 8,
    college_name: "St. Joseph's College of Engineering",
    short_name: "St. Joseph's",
    total_points: 140,
    gold_count: 0,
    silver_count: 2,
    bronze_count: 3,
    total_teams: 5
  },
  {
    rank: 9,
    college_name: "Rajalakshmi Engineering College (REC)",
    short_name: "REC Chennai",
    total_points: 110,
    gold_count: 0,
    silver_count: 2,
    bronze_count: 1,
    total_teams: 4
  },
  {
    rank: 10,
    college_name: "Easwari Engineering College (Host)",
    short_name: "EEC",
    total_points: 90,
    gold_count: 0,
    silver_count: 1,
    bronze_count: 2,
    total_teams: 4
  }
];

let colleges = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_COLLEGES));
let apiUrl = localStorage.getItem("symposium_leaderboard_api") || "http://localhost:8000/api/v1/admin/leaderboard";
let apiToken = localStorage.getItem("symposium_leaderboard_token") || "";

function renderLeaderboard() {
  const search = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const filtered = colleges.filter(c =>
    c.college_name.toLowerCase().includes(search) ||
    (c.short_name && c.short_name.toLowerCase().includes(search))
  );

  const gold = colleges.find(c => c.rank === 1);
  const silver = colleges.find(c => c.rank === 2);
  const bronze = colleges.find(c => c.rank === 3);

  // Render Top 3 Podium
  const podium = document.getElementById("podiumGrid");
  podium.innerHTML = `
    <!-- 2nd Place: Silver -->
    ${silver ? `
      <div class="podium-card silver-card">
        <span class="rank-badge silver-badge">2nd Rank • Silver Runner-Up</span>
        <h3 class="clg-name">${silver.college_name}</h3>
        <div class="clg-sub">${silver.short_name || ""}</div>
        <span class="points-val">${silver.total_points}</span>
        <span class="points-lbl">Championship Points</span>
        <div class="medals-row">
          <span class="medal-pill">🥇 ${silver.gold_count} Gold</span>
          <span class="medal-pill">🥈 ${silver.silver_count} Silver</span>
          <span class="medal-pill">🥉 ${silver.bronze_count} Bronze</span>
        </div>
      </div>
    ` : ""}

    <!-- 1st Place: Gold Champion -->
    ${gold ? `
      <div class="podium-card gold-card">
        <span class="rank-badge gold-badge">1st Rank • Overall Champion</span>
        <h3 class="clg-name">${gold.college_name}</h3>
        <div class="clg-sub">${gold.short_name || ""}</div>
        <span class="points-val">${gold.total_points}</span>
        <span class="points-lbl">Championship Points</span>
        <div class="medals-row">
          <span class="medal-pill" style="border-color:#ca8a04; color:#854d0e;">🥇 ${gold.gold_count} Gold</span>
          <span class="medal-pill">🥈 ${gold.silver_count} Silver</span>
          <span class="medal-pill">🥉 ${gold.bronze_count} Bronze</span>
        </div>
      </div>
    ` : ""}

    <!-- 3rd Place: Bronze -->
    ${bronze ? `
      <div class="podium-card bronze-card">
        <span class="rank-badge bronze-badge">3rd Rank • Bronze Runner-Up</span>
        <h3 class="clg-name">${bronze.college_name}</h3>
        <div class="clg-sub">${bronze.short_name || ""}</div>
        <span class="points-val">${bronze.total_points}</span>
        <span class="points-lbl">Championship Points</span>
        <div class="medals-row">
          <span class="medal-pill">🥇 ${bronze.gold_count} Gold</span>
          <span class="medal-pill">🥈 ${bronze.silver_count} Silver</span>
          <span class="medal-pill">🥉 ${bronze.bronze_count} Bronze</span>
        </div>
      </div>
    ` : ""}
  `;

  // Render Standings Table (#4 and below)
  const rest = filtered.filter(c => c.rank > 3);
  const standingsList = document.getElementById("standingsList");
  const highestScore = gold ? gold.total_points : 1;

  if (rest.length === 0) {
    standingsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No colleges found matching filter.</div>`;
  } else {
    standingsList.innerHTML = rest.map(c => {
      const pct = Math.round((c.total_points / highestScore) * 100);
      return `
        <div class="stand-row">
          <div class="row-rank">#${c.rank}</div>
          <div>
            <div class="row-college-name">${c.college_name}</div>
            <div class="row-college-sub">${c.short_name || "Institution"} • ${c.total_teams || 0} winning teams</div>
          </div>
          <div class="hide-mobile">
            <span class="medal-pill">🥇 ${c.gold_count}</span>
            <span class="medal-pill">🥈 ${c.silver_count}</span>
            <span class="medal-pill">🥉 ${c.bronze_count}</span>
          </div>
          <div class="row-pts">
            <span class="row-pts-num">${c.total_points}</span>
            <span class="row-pts-sub">points</span>
            <div class="bar-wrap" title="${pct}% of leader">
              <div class="bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Update Stats Counters
  document.getElementById("statColleges").innerText = colleges.length;
  document.getElementById("statPoints").innerText = colleges.reduce((s, c) => s + (c.total_points || 0), 0) + " pts";
  document.getElementById("statTeams").innerText = colleges.reduce((s, c) => s + (c.total_teams || 0), 0) + " Teams";
  document.getElementById("statLeader").innerText = gold ? (gold.short_name || gold.college_name.split(',')[0]) : "TBD";
  document.getElementById("tableCountText").innerText = `Showing ${filtered.length} colleges`;
}

async function fetchBackendLeaderboard() {
  const btn = document.getElementById("btnRefresh");
  const originalText = btn.innerText;
  btn.innerText = "Syncing...";
  btn.disabled = true;

  try {
    const headers = { Accept: "application/json" };
    if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

    const res = await fetch(apiUrl, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = await res.json();
    let list = Array.isArray(raw) ? raw : (raw.leaderboard || raw.data || raw.standings || raw.colleges || []);

    if (list && list.length > 0) {
      colleges = list.map((item, idx) => ({
        rank: Number(item.rank || idx + 1),
        college_name: item.college_name || item.name || item.college || `College #${idx + 1}`,
        short_name: item.short_name || item.code || "",
        total_points: Number(item.total_points ?? item.points ?? item.score ?? 0),
        gold_count: Number(item.gold_count ?? item.gold ?? 0),
        silver_count: Number(item.silver_count ?? item.silver ?? 0),
        bronze_count: Number(item.bronze_count ?? item.bronze ?? 0),
        total_teams: Number(item.total_teams ?? 0)
      }));

      colleges.sort((a, b) => b.total_points - a.total_points);
      colleges.forEach((c, i) => c.rank = i + 1);
    }

    document.getElementById("lastUpdatedSubtitle").innerText = `Live synced with backend at ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    alert(`Backend sync notice: Could not reach endpoint (${err.message}). Displaying local sample standings.`);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
    renderLeaderboard();
  }
}

function handleSearch() {
  renderLeaderboard();
}

function toggleProjectorMode() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function exportCSV() {
  const headers = ["Rank", "College Name", "Short Name", "Total Points", "Gold", "Silver", "Bronze", "Total Teams"];
  const rows = colleges.map(c => [
    c.rank,
    `"${c.college_name.replace(/"/g, '""')}"`,
    `"${c.short_name || ""}"`,
    c.total_points,
    c.gold_count,
    c.silver_count,
    c.bronze_count,
    c.total_teams
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Symposium_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Modal handlers
function openApiModal() {
  document.getElementById("apiModal").style.display = "flex";
  document.getElementById("apiEndpointInput").value = apiUrl;
  document.getElementById("apiTokenInput").value = apiToken;
}

function closeApiModal() {
  document.getElementById("apiModal").style.display = "none";
}

function saveApiAndConnect() {
  apiUrl = document.getElementById("apiEndpointInput").value.trim();
  apiToken = document.getElementById("apiTokenInput").value.trim();

  localStorage.setItem("symposium_leaderboard_api", apiUrl);
  localStorage.setItem("symposium_leaderboard_token", apiToken);

  closeApiModal();
  fetchBackendLeaderboard();
}

function loadSampleData() {
  colleges = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_COLLEGES));
  closeApiModal();
  renderLeaderboard();
}

// Initial render
renderLeaderboard();
