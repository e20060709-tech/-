import { useState, useCallback, useMemo } from 'react';
import './App.css';

const numberFormatter = new Intl.NumberFormat('zh-TW');

const SUMMARY = {
  netWorth: 2_131_500,
  totalInvested: 2_431_500,
  totalExposure: 2_432_000,
  exposureRate: '114.07%',
  ltv: '19.00%',
  expectedReturn: '7.07%',
  allocations: [
    { name: '台股', percentage: 22.2, color: 'emerald' },
    { name: '美股', percentage: 61.8, color: 'indigo' },
    { name: '海外', percentage: 16.0, color: 'cyan' }
  ]
};

const TABS = [
  { id: 'overview', label: '總覽與圖表' },
  { id: 'assets', label: '資產與再平衡' },
  { id: 'flow', label: '生涯 Flow 預測' },
  { id: 'stress', label: '斷頭與壓力測試' },
  { id: 'history', label: '歷史績效走勢' }
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [snapshots, setSnapshots] = useState([
    { date: '2026-08-31', netWorth: 2_050_000 },
    { date: '2026-09-30', netWorth: 2_131_500 }
  ]);
  const [newDate, setNewDate] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const formattedSnapshots = useMemo(
    () =>
      snapshots
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [snapshots]
  );

  const cards = useMemo(
    () => [
      { label: '淨資產（含現金）', value: `$${numberFormatter.format(SUMMARY.netWorth)}` },
      { label: '總投資價值', value: `$${numberFormatter.format(SUMMARY.totalInvested)}` },
      { label: '目前總曝險率', value: SUMMARY.exposureRate },
      { label: '整體負債比 (LTV)', value: SUMMARY.ltv },
      { label: '組合綜合預期報酬', value: SUMMARY.expectedReturn }
    ],
    []
  );

  const handleAddSnapshot = useCallback(
    (event) => {
      event.preventDefault();
      if (!newDate || !newAmount) return;

      setSnapshots((prev) => [
        ...prev,
        { date: newDate, netWorth: Number(newAmount) }
      ]);
      setNewDate('');
      setNewAmount('');
    },
    [newDate, newAmount]
  );

  const deleteSnapshot = useCallback((index) => {
    setSnapshots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="wealth-app">
      <header className="app-header">
        <div>
          <h1>📊 資產管理與生涯決策系統 <span>Pro</span></h1>
        </div>

        <div className="header-actions">
          <div className="net-worth-box">
            淨資產: <strong>${numberFormatter.format(SUMMARY.netWorth)}</strong>
          </div>
          {['另存紀錄', '歷史紀錄', '匯入/匯出'].map((label) => (
            <button key={label} type="button" className="ghost-btn">
              {label}
            </button>
          ))}
          <button type="button" className="danger-btn">
            清除
          </button>
        </div>
      </header>

      <nav className="tab-nav" aria-label="頁籤導覽">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="summary-grid">
        {cards.map((card, index) => (
          <article key={index} className="summary-card">
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="overview-grid">
          <section className="panel allocation-panel">
            <div className="panel-header">
              <h3>三大區域配置</h3>
              <small>依曝險價值計算 (總曝險 ${numberFormatter.format(SUMMARY.totalExposure)})</small>
            </div>

            <div className="allocation-list">
              {SUMMARY.allocations.map((item) => (
                <div key={item.name} className="allocation-row">
                  <div className="allocation-name">
                    <span className={`dot ${item.color}`}></span>
                    {item.name}
                  </div>
                  <strong>{item.percentage}%</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel chart-panel">
            <div className="panel-header chart-header">
              <div>
                <h3>生涯資產預測折線圖</h3>
                <small>滑鼠懸停可查看詳細數字；橘點為實際紀錄</small>
              </div>
              <span className="badge">實質購買力</span>
            </div>
            <div className="chart-box">[ 互動式圖表畫布 (可整合 Chart.js 或 Recharts) ]</div>
          </section>
        </div>
      )}

      {activeTab === 'history' && (
        <section className="panel history-panel">
          <div className="panel-header history-header">
            <div>
              <h3>手動淨值快照管理</h3>
              <small>新增日期與數值後即可記錄快照；資料將依日期排序。</small>
            </div>
          </div>

          <form className="snapshot-form" onSubmit={handleAddSnapshot}>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              step="1000"
              value={newAmount}
              placeholder="淨資產金額 (TWD)"
              onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
              required
            />
            <button type="submit">新增快照</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>淨值 (TWD)</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {formattedSnapshots.map((item, index) => (
                  <tr key={`${item.date}-${index}`}>
                    <td>{item.date}</td>
                    <td>${numberFormatter.format(item.netWorth)}</td>
                    <td className="text-right">
                      <button type="button" className="delete-btn" onClick={() => deleteSnapshot(index)}>
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {['assets', 'flow', 'stress'].includes(activeTab) && (
        <div className="panel placeholder-panel">
          此分頁（{activeTab}）的核心邏輯已架構完畢，可讓 Codex 協助擴充細部計算公式與圖表。
        </div>
      )}
    </div>
  );
}

export default App;
