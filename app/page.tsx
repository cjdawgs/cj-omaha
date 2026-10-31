"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Sliders, PlusCircle, BarChart3, CheckCircle2, Calendar, Clock
} from 'lucide-react';
import { getTodayDateString, getTimeSlotFromDate, TimeSlot } from '@/lib/slates';

const DEFAULT_WEIGHTS = { workload: 40, recent: 30, matchup: 20, market: 10 };

const getConfidenceTier = (score: number) => {
  if (score >= 70) return { label: 'Elite', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10' };
  if (score >= 65) return { label: 'High Confidence', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
  if (score >= 60) return { label: 'Strong', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  if (score >= 55) return { label: 'Watchlist', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
  return { label: 'Pass', color: 'bg-slate-700/40 text-slate-400 border-slate-600/40' };
};

const calculatePropEdge = (prop: any, weights: typeof DEFAULT_WEIGHTS) => {
  const totalWeight = weights.workload + weights.recent + weights.matchup + weights.market;
  if (totalWeight === 0) return { projection: prop.sportsbookLine, edgePct: 0, confidenceScore: 50 };

  const normW = {
    workload: weights.workload / totalWeight,
    recent: weights.recent / totalWeight,
    matchup: weights.matchup / totalWeight,
    market: weights.market / totalWeight
  };

  const workload = prop.workloadScore ?? 85;
  const recentProd = prop.recentProdScore ?? 85;
  const matchup = prop.matchupScore ?? 80;
  const market = prop.marketScore ?? 80;

  const confidenceScore = Math.round(
    (workload * normW.workload) +
    (recentProd * normW.recent) +
    (matchup * normW.matchup) +
    (market * normW.market)
  );

  const multiplier = 1 + ((confidenceScore - 60) * 0.0035);
  let projection = Number(prop.sportsbookLine) * multiplier;

  if (prop.propType === "Anytime TD") {
    projection = Math.min(Math.max(projection, 0.1), 0.99);
  } else {
    projection = Math.round(projection * 10) / 10;
  }

  const diff = projection - Number(prop.sportsbookLine);
  const edgePct = Math.round((diff / Number(prop.sportsbookLine)) * 1000) / 10;

  return { projection, edgePct, confidenceScore };
};

export default function Home() {
  const [propsData, setPropsData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Slate Control States
  const [leagueFilter, setLeagueFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [timeSlotFilter, setTimeSlotFilter] = useState<TimeSlot>('ALL');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    player: '',
    team: '',
    league: 'NFL',
    position: 'QB',
    propType: 'Passing Yds',
    sportsbookLine: '',
    sportsbook: 'FanDuel',
    odds: '-110',
    workloadScore: 85,
    recentProdScore: 85,
    matchupScore: 80,
    marketScore: 80,
    gameTime: ''
  });

  const fetchProps = async () => {
    try {
      const res = await fetch('/api/props');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPropsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch live props from database:', err);
    }
  };

  useEffect(() => {
    fetchProps();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/props/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sportsbookLine: Number(formData.sportsbookLine),
          workloadScore: Number(formData.workloadScore),
          recentProdScore: Number(formData.recentProdScore),
          matchupScore: Number(formData.matchupScore),
          marketScore: Number(formData.marketScore)
        })
      });

      if (res.ok) {
        setIsSuccessToast(true);
        setTimeout(() => setIsSuccessToast(false), 3000);
        setFormData({
          player: '', team: '', league: 'NFL', position: 'QB',
          propType: 'Passing Yds', sportsbookLine: '', sportsbook: 'FanDuel',
          odds: '-110', workloadScore: 85, recentProdScore: 85, matchupScore: 80, marketScore: 80, gameTime: ''
        });
        await fetchProps();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const evaluatedProps = useMemo(() => {
    return propsData.map((prop: any) => {
      const calc = calculatePropEdge(prop, weights);
      return { ...prop, ...calc, tierInfo: getConfidenceTier(calc.confidenceScore) };
    });
  }, [propsData, weights]);

  const filteredProps = useMemo(() => {
    return evaluatedProps.filter((p: any) => {
      // 1. Sport Filter
      if (leagueFilter !== 'ALL' && p.league !== leagueFilter) return false;

      // 2. Date Filter
      if (selectedDate && p.gameTime) {
        const propDate = new Date(p.gameTime).toISOString().split('T')[0];
        if (propDate !== selectedDate) return false;
      }

      // 3. Time Slot Filter (EDT)
      if (timeSlotFilter !== 'ALL' && p.gameTime) {
        const slot = getTimeSlotFromDate(p.gameTime);
        if (slot !== timeSlotFilter) return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return p.player.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
      }
      return true;
    }).sort((a: any, b: any) => b.edgePct - a.edgePct);
  }, [evaluatedProps, leagueFilter, selectedDate, timeSlotFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">CJ OMAHA</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">SLATE ENGINE</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium ${activeTab === 'dashboard' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'}`}>
              <BarChart3 className="w-4 h-4" /> <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('admin')} className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium ${activeTab === 'admin' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'}`}>
              <Sliders className="w-4 h-4" /> <span>Model Admin</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Slate Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex flex-wrap items-center gap-3">
                {/* Sport Selector */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {['ALL', 'NFL', 'NCAA'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLeagueFilter(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        leagueFilter === l ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                {/* Date Picker (Defaults to Today) */}
                <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Time Slot Buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
                  {(['ALL', 'EARLY', 'AFTERNOON', 'LATE'] as TimeSlot[]).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTimeSlotFilter(slot)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        timeSlotFilter === slot ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {slot === 'EARLY' ? 'Early (12-2PM)' : slot === 'AFTERNOON' ? 'Afternoon (2-7PM)' : slot === 'LATE' ? 'Late (7PM+)' : 'All Slots'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Search Bar */}
              <input
                type="text"
                placeholder="Search player or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
              />
            </div>

            {/* Dashboard Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">Prop</th>
                    <th className="py-3.5 px-4">Sportsbook Line</th>
                    <th className="py-3.5 px-4">Projection</th>
                    <th className="py-3.5 px-4">Edge (%)</th>
                    <th className="py-3.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredProps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No player props match the selected slate date, sport, or time slot.
                      </td>
                    </tr>
                  ) : (
                    filteredProps.map((prop: any) => (
                      <tr key={prop.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-bold text-slate-100">{prop.player} ({prop.team})</td>
                        <td className="py-3.5 px-4 text-slate-300">{prop.propType}</td>
                        <td className="py-3.5 px-4 text-slate-200">{prop.sportsbookLine} ({prop.sportsbook})</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{prop.projection}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">+{prop.edgePct}%</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${prop.tierInfo.color}`}>
                            {prop.confidenceScore} • {prop.tierInfo.label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Model Weights Section */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>Model Weight Settings</span>
              </h2>
              {Object.keys(weights).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold capitalize">
                    <span>{key} Weight</span>
                    <span className="text-emerald-400">{weights[key as keyof typeof weights]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights[key as keyof typeof weights]}
                    onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Add New Prop Form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Add Slate Player Prop</span>
              </h2>

              {isSuccessToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Prop successfully added to Neon database!</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Josh Allen"
                      value={formData.player}
                      onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Team</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BUF"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">League</label>
                    <select
                      value={formData.league}
                      onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="NFL">NFL</option>
                      <option value="NCAA">NCAA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Kickoff Time (EDT)</label>
                    <input
                      type="datetime-local"
                      value={formData.gameTime}
                      onChange={(e) => setFormData({ ...formData, gameTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Prop Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Passing Yds"
                      value={formData.propType}
                      onChange={(e) => setFormData({ ...formData, propType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Sportsbook Line</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="e.g. 265.5"
                      value={formData.sportsbookLine}
                      onChange={(e) => setFormData({ ...formData, sportsbookLine: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition-all"
                >
                  Save & Add Prop
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}