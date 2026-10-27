"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./LeaderboardComponent.module.css";

export interface CollegeItem {
  rank: number;
  college_name: string;
  short_name?: string;
  total_points: number;
  gold_count: number;
  silver_count: number;
  bronze_count: number;
  total_teams: number;
}

const DEFAULT_SAMPLE: CollegeItem[] = [
  { rank: 1, college_name: "PSG College of Technology, Coimbatore", short_name: "PSG Tech", total_points: 580, gold_count: 5, silver_count: 3, bronze_count: 2, total_teams: 12 },
  { rank: 2, college_name: "SSN College of Engineering, Chennai", short_name: "SSN", total_points: 460, gold_count: 3, silver_count: 4, bronze_count: 2, total_teams: 10 },
  { rank: 3, college_name: "College of Engineering, Guindy (CEG Anna Univ)", short_name: "CEG Chennai", total_points: 390, gold_count: 2, silver_count: 3, bronze_count: 5, total_teams: 11 },
  { rank: 4, college_name: "Chennai Institute of Technology (CIT)", short_name: "CIT Chennai", total_points: 310, gold_count: 2, silver_count: 2, bronze_count: 2, total_teams: 8 },
  { rank: 5, college_name: "Sri Sairam Engineering College", short_name: "Sairam Engg", total_points: 260, gold_count: 1, silver_count: 3, bronze_count: 2, total_teams: 7 },
  { rank: 6, college_name: "Vellore Institute of Technology (VIT)", short_name: "VIT Chennai", total_points: 220, gold_count: 1, silver_count: 2, bronze_count: 3, total_teams: 7 },
  { rank: 7, college_name: "SRM Institute of Science and Technology", short_name: "SRM IST", total_points: 190, gold_count: 1, silver_count: 1, bronze_count: 4, total_teams: 6 },
  { rank: 8, college_name: "St. Joseph's College of Engineering", short_name: "St. Joseph's", total_points: 140, gold_count: 0, silver_count: 2, bronze_count: 3, total_teams: 5 },
  { rank: 9, college_name: "Rajalakshmi Engineering College (REC)", short_name: "REC Chennai", total_points: 110, gold_count: 0, silver_count: 2, bronze_count: 1, total_teams: 4 },
  { rank: 10, college_name: "Easwari Engineering College (Host)", short_name: "EEC", total_points: 90, gold_count: 0, silver_count: 1, bronze_count: 2, total_teams: 4 }
];

export default function LeaderboardComponent({ apiEndpoint = "/api/v1/admin/leaderboard" }: { apiEndpoint?: string }) {
  const [data, setData] = useState<CollegeItem[]>(DEFAULT_SAMPLE);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBackend = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.leaderboard || raw.data || raw.standings || []);
      if (list.length > 0) {
        const sorted = list.map((item: any, idx: number) => ({
          rank: item.rank || (idx + 1),
          college_name: item.college_name || item.name || item.college || `College #${idx + 1}`,
          short_name: item.short_name || item.code || "",
          total_points: Number(item.total_points ?? item.points ?? item.score ?? 0),
          gold_count: Number(item.gold_count ?? item.gold ?? 0),
          silver_count: Number(item.silver_count ?? item.silver ?? 0),
          bronze_count: Number(item.bronze_count ?? item.bronze ?? 0),
          total_teams: Number(item.total_teams ?? 0)
        })).sort((a: any, b: any) => b.total_points - a.total_points);
        sorted.forEach((c: any, i: number) => c.rank = i + 1);
        setData(sorted);
      }
    } catch {
      // Graceful fallback to default data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackend();
  }, [apiEndpoint]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(c => c.college_name.toLowerCase().includes(q) || (c.short_name && c.short_name.toLowerCase().includes(q)));
  }, [data, search]);

  const gold = data.find(c => c.rank === 1);
  const silver = data.find(c => c.rank === 2);
  const bronze = data.find(c => c.rank === 3);
  const rest = filtered.filter(c => c.rank > 3);
  const maxPts = gold ? gold.total_points : 1;

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.kicker}>🏆 Live Standings</div>
          <h1 className={styles.title}>Symposium Championship Leaderboard</h1>
        </div>
      </div>

      {/* Podium */}
      <div className={styles.podiumGrid}>
        {silver && (
          <div className={`${styles.podiumCard} ${styles.silver}`}>
            <span className={styles.badge}>2nd Rank • Silver</span>
            <div className={styles.clgName}>{silver.college_name}</div>
            <div className={styles.clgSub}>{silver.short_name}</div>
            <div className={styles.pts}>{silver.total_points}</div>
            <div className={styles.ptsLbl}>Points</div>
            <div className={styles.medals}>
              <span>🥇 {silver.gold_count}</span>
              <span>🥈 {silver.silver_count}</span>
              <span>🥉 {silver.bronze_count}</span>
            </div>
          </div>
        )}

        {gold && (
          <div className={`${styles.podiumCard} ${styles.gold}`}>
            <span className={styles.badge} style={{ borderColor: "#ffd700", color: "#ffd700" }}>🥇 1st Rank • Gold Champion</span>
            <div className={styles.clgName} style={{ fontSize: "1.4rem" }}>{gold.college_name}</div>
            <div className={styles.clgSub}>{gold.short_name}</div>
            <div className={styles.pts} style={{ color: "#ffd700" }}>{gold.total_points}</div>
            <div className={styles.ptsLbl}>Points</div>
            <div className={styles.medals}>
              <span style={{ color: "#ffd700" }}>🥇 {gold.gold_count}</span>
              <span>🥈 {gold.silver_count}</span>
              <span>🥉 {gold.bronze_count}</span>
            </div>
          </div>
        )}

        {bronze && (
          <div className={`${styles.podiumCard} ${styles.bronze}`}>
            <span className={styles.badge}>3rd Rank • Bronze</span>
            <div className={styles.clgName}>{bronze.college_name}</div>
            <div className={styles.clgSub}>{bronze.short_name}</div>
            <div className={styles.pts} style={{ color: "#fb923c" }}>{bronze.total_points}</div>
            <div className={styles.ptsLbl}>Points</div>
            <div className={styles.medals}>
              <span>🥇 {bronze.gold_count}</span>
              <span>🥈 {bronze.silver_count}</span>
              <span>🥉 {bronze.bronze_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Standings Table */}
      <div className={styles.tableBox}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Complete Standings</h2>
          <input
            type="text"
            placeholder="🔍 Search college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {rest.map(c => (
            <div key={c.rank} className={styles.row}>
              <div className={styles.rowRank}>#{c.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{c.college_name}</div>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{c.short_name} • {c.total_teams} winning team(s)</div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <span className={styles.pill}>🥇 {c.gold_count}</span>
                <span className={styles.pill}>🥈 {c.silver_count}</span>
                <span className={styles.pill}>🥉 {c.bronze_count}</span>
              </div>
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{c.total_points}</div>
                <div style={{ fontSize: "0.65rem", color: "#71717a" }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
