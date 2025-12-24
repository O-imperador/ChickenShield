import React, { useEffect, useState, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Globe, Mail, Fingerprint, ExternalLink, Download, History, Brain, Baby } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Mock Data for the Charts - Using Explicit Hex
const softwareData = [
  { name: 'Adware', value: 78, color: '#64ffda' },
  { name: 'Phishing', value: 25, color: '#e6f1ff' },
  { name: 'Ransomware', value: 15, color: '#ffd166' },
  { name: 'Spyware', value: 9, color: '#ef476f' },
];

const activityData = [
  { time: '10:00', threats: 12 },
  { time: '11:00', threats: 19 },
  { time: '12:00', threats: 8 },
  { time: '13:00', threats: 24 },
  { time: '14:00', threats: 15 },
  { time: '15:00', threats: 32 },
];

function App() {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [simpleMode, setSimpleMode] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => {
    // 1. Load History from Local Storage
    const savedHistory = localStorage.getItem('chicken_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // 2. Check for new data in URL
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');

    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        setReport(decoded);
        addToHistory(decoded);
      } catch (e) {
        console.error("Failed to parse report data", e);
      }
    }
  }, []);

  const addToHistory = (newReport) => {
    setHistory(prev => {
      // Avoid duplicates based on timestamp
      if (prev.some(item => item.timestamp === newReport.timestamp)) return prev;

      const newHistory = [newReport, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem('chicken_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      // Force a small delay to ensure rendering matches
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#0a192f', // Explicit hex
        scale: 2,
        useCORS: true,
        logging: false, // Turn off logging
        ignoreElements: (element) => element.classList.contains('no-print') // Optional hook
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ChickenShield_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("PDF Generation Failed:", error);
      alert(`PDF Error: ${error.message}`);
    }
  };

  const getRiskColors = (score) => {
    if (score < 40) return { text: '#64ffda', border: '#64ffda', bg: 'rgba(100, 255, 218, 0.1)' };
    if (score < 70) return { text: '#facc15', border: '#facc15', bg: 'rgba(250, 204, 21, 0.1)' };
    return { text: '#ef4444', border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const getExplanation = () => {
    if (!report) return "";
    if (simpleMode) {
      if (report.explanation_simple) return report.explanation_simple;
      const risk = report.verdict === 'safe' ? "Safe" : "Dangerous";
      return `(Detailed Kid Mode requires a fresh scan!) This website looks ${risk}. Imagine a castle - the guards are saying it's ${risk === 'Safe' ? 'okay to enter' : 'better to stay outside'}!`;
    }
    return report.explanation_technical || report.explanation;
  };

  // Safe shadow style for html2canvas (no oklch)
  const safeShadow = { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)' };

  return (
    <div className="min-h-screen p-6 font-sans select-none" ref={dashboardRef} style={{ backgroundColor: '#0a192f', color: '#e6f1ff' }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid #233554' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#1a73e8' }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest">CHICKEN SHIELD</h1>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#64ffda' }}>Cyber Threat Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">

          {/* ELI5 Toggle */}
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
            style={{
              backgroundColor: simpleMode ? 'rgba(236, 72, 153, 0.2)' : '#112240',
              borderColor: simpleMode ? '#ec4899' : '#1a73e8',
              color: simpleMode ? '#f472b6' : '#9ca3af'
            }}
          >
            {simpleMode ? <Baby className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            <span className="text-xs font-bold">{simpleMode ? "KID MODE" : "PRO MODE"}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-white transition-colors"
            style={{ backgroundColor: '#233554' }}
          >
            <Download className="w-4 h-4" />
            <span className="text-xs font-bold">PDF</span>
          </button>

          <div className="w-10 h-10 rounded-full flex items-center justify-center border ml-2" style={{ backgroundColor: '#233554', borderColor: '#64ffda' }}>
            <Activity className="w-5 h-5 animate-pulse" style={{ color: '#64ffda' }} />
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Stats & History */}
        <div className="space-y-6">
          {/* Stats Chart */}
          <div className="rounded-xl p-6 border" style={{ backgroundColor: '#112240', borderColor: '#233554', ...safeShadow }}>
            <h2 className="text-lg font-semibold text-white mb-6 pl-3" style={{ borderLeft: '4px solid #1a73e8' }}>Global Threat Index</h2>
            <div style={{ width: '100%', height: '192px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={softwareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {softwareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#112240', borderColor: '#233554', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {softwareData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs" style={{ color: '#d1d5db' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History Widget */}
          <div className="rounded-xl p-6 border overflow-y-auto" style={{ backgroundColor: '#112240', borderColor: '#233554', maxHeight: '384px', ...safeShadow }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4" style={{ color: '#64ffda' }} />
              <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
            </div>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs" style={{ color: '#6b7280' }}>No history yet.</p>
              ) : (
                history.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setReport(item)}
                    className="p-3 rounded border cursor-pointer transition-colors group"
                    style={{ backgroundColor: '#0a192f', borderColor: '#233554' }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase" style={{ color: item.verdict === 'safe' ? '#64ffda' : '#ef4444' }}>{item.verdict}</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#d1d5db' }}>{item.source || "Unknown Source"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Main Report */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Scan Card */}
          <div className="rounded-xl p-6 border relative overflow-hidden group" style={{ backgroundColor: '#112240', borderColor: '#233554', ...safeShadow }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity">
              <Shield className="w-48 h-48" style={{ color: '#1a73e8' }} />
            </div>

            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Latest Intelligence Report</h2>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>Source: {report ? report.content_type?.toUpperCase() : "WAITING FOR DATA..."}</p>
                </div>
                {report && (() => {
                  const colors = getRiskColors(report.risk_score);
                  return (
                    <div className="px-4 py-2 rounded-full border flex items-center gap-2"
                      style={{ borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}>
                      <span className="text-2xl font-bold">{report.risk_score}</span>
                      <span className="text-xs uppercase">Risk Score</span>
                    </div>
                  );
                })()}
              </div>

              {!report ? (
                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg" style={{ borderColor: '#233554', color: '#6b7280' }}>
                  <Activity className="w-10 h-10 mb-2 opacity-50" />
                  <p>No active scan data found.</p>
                  <p className="text-xs mt-2">Use the extension to scan a site.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: simpleMode ? 'rgba(131, 24, 67, 0.2)' : '#0a192f',
                      borderColor: simpleMode ? 'rgba(236, 72, 153, 0.3)' : '#233554'
                    }}>
                    <p className="text-sm mb-1 uppercase text-xs tracking-wider" style={{ color: simpleMode ? '#f472b6' : '#d1d5db' }}>
                      {simpleMode ? "Simple Explanation" : "Technical Analysis Verdict"}
                    </p>

                    <div className="flex items-center gap-3">
                      {report.verdict === 'safe' && <CheckCircle style={{ color: '#64ffda' }} />}
                      {report.verdict !== 'safe' && <AlertTriangle style={{ color: '#ef4444' }} />}
                      <span className="text-xl font-bold uppercase" style={{ color: report.verdict === 'safe' ? '#64ffda' : '#ef4444' }}>
                        {report.verdict}
                      </span>
                    </div>

                    <p className="mt-2 leading-relaxed" style={{ color: simpleMode ? '#fce7f3' : '#d1d5db' }}>
                      {getExplanation()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Social Indicators */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(10, 25, 47, 0.5)' }}>
                      <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#64ffda' }}>
                        <Fingerprint className="w-4 h-4" /> Social Engineering
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {report.social_engineering_indicators?.length > 0 ? (
                          report.social_engineering_indicators.map((tag, i) => (
                            <span key={i} className="px-2 py-1 text-xs rounded border"
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                              {tag.replace('_', ' ')}
                            </span>
                          ))
                        ) : <span className="text-xs" style={{ color: '#6b7280' }}>None detected</span>}
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(10, 25, 47, 0.5)' }}>
                      <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#60a5fa' }}>
                        <Globe className="w-4 h-4" /> Technical Flags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {report.technical_indicators?.length > 0 ? (
                          report.technical_indicators.map((tag, i) => (
                            <span key={i} className="px-2 py-1 text-xs rounded border"
                              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                              {tag.replace('_', ' ')}
                            </span>
                          ))
                        ) : <span className="text-xs" style={{ color: '#6b7280' }}>None detected</span>}
                      </div>
                    </div>
                  </div>

                  {/* Deep Intelligence Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #233554' }}>
                    <div className="p-3 rounded border" style={{ backgroundColor: '#0a192f', borderColor: '#233554' }}>
                      <p className="text-xs uppercase mb-1" style={{ color: '#64ffda' }}>Source / Domain</p>
                      <p className="text-sm font-mono truncate" style={{ color: '#22d3ee' }} title={report.source}>{report.source || 'Unknown'}</p>
                    </div>
                    <div className="p-3 rounded border" style={{ backgroundColor: '#0a192f', borderColor: '#233554' }}>
                      <p className="text-xs uppercase mb-1" style={{ color: '#64ffda' }}>Reputation</p>
                      <p className="text-sm font-bold"
                        style={{ color: report.sender_reputation === 'high' ? '#4ade80' : report.sender_reputation === 'low' ? '#ef4444' : '#facc15' }}>
                        {report.sender_reputation ? report.sender_reputation.toUpperCase() : 'UNKNOWN'}
                      </p>
                    </div>
                    <div className="p-3 rounded border" style={{ backgroundColor: '#0a192f', borderColor: '#233554' }}>
                      <p className="text-xs uppercase mb-1" style={{ color: '#64ffda' }}>Domain Age</p>
                      <p className="text-sm text-white">
                        {report.domain_age_estimate_days ? `${report.domain_age_estimate_days} days` : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded border" style={{ backgroundColor: '#0a192f', borderColor: '#233554' }}>
                      <p className="text-xs uppercase mb-1" style={{ color: '#64ffda' }}>Scan Time</p>
                      <p className="text-sm" style={{ color: '#9ca3af' }}>
                        {report.timestamp ? new Date(report.timestamp).toLocaleTimeString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Graph */}
          <div className="rounded-xl p-6 border" style={{ backgroundColor: '#112240', borderColor: '#233554', ...safeShadow }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-white">Network Activity</h3>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#233554', color: '#64ffda' }}>Live</span>
            </div>
            <div style={{ width: '100%', height: '192px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#112240', borderColor: '#233554', borderRadius: '8px' }}
                    itemStyle={{ color: '#64ffda' }}
                  />
                  <Area type="monotone" dataKey="threats" stroke="#1a73e8" fillOpacity={1} fill="url(#colorThreats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
