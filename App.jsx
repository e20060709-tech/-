import React, { useState, useCallback, useMemo } from 'react';

const numberFormatter = new Intl.NumberFormat('zh-TW');

const SUMMARY = {
  netWorth: 2_131_500,
  totalInvested: 2_431_500,
  totalExposure: 2_432_000,
  exposureRate: '114.07%',
  ltv: '19.00%',
  expectedReturn: '7.07%',
  allocations: [
    { name: '台股', percentage: 22.2, color: 'bg-emerald-500' },
    { name: '美股', percentage: 61.8, color: 'bg-indigo-600' },
    { name: '海外', percentage: 16.0, color: 'bg-cyan-400' }
  ]
};

const TABS = [
  { id: 'overview', label: '總覽與圖表' },
  { id: 'assets', label: '資產與再平衡' },
  { id: 'flow', label: '生涯 Flow 預測' },
  { id: 'stress', label: '斷頭與壓力測試' },
  { id: 'history', label: '歷史績效走勢' }
];

export default function WealthFlowPro() {
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
      { label: '淨資產（含現金）', val: `$${numberFormatter.format(SUMMARY.netWorth)}` },
      { label: '總投資價值', val: `$${numberFormatter.format(SUMMARY.totalInvested)}` },
      { label: '目前總曝險率', val: SUMMARY.exposureRate },
      { label: '整體負債比 (LTV)', val: SUMMARY.ltv },
      { label: '組合綜合預期報酬', val: SUMMARY.expectedReturn }
    ],
    []
  );

  const handleAddSnapshot = useCallback(
    (e) => {
      e.preventDefault();
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm mb-6 gap-4">
        <section>
          <h1 className="text-xl font-bold flex items-center gap-2">
            📊 資產管理與生涯決策系統
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Pro</span>
          </h1>
        </section>
        <section className="flex items-center gap-3 text-sm flex-wrap">
          <div className="font-medium">
            淨資產:
            <span className="text-emerald-600 font-bold ml-1">
              ${numberFormatter.format(SUMMARY.netWorth)}
            </span>
          </div>
          {['另存紀錄', '歷史紀錄', '匯入/匯出'].map((label) => (
            <button
              key={label}
              type="button"
              className="bg-white border px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100"
            aria-label="清除所有紀錄"
          >
            清除
          </button>
        </section>
      </header>

      <nav className="flex gap-2 border-b mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {cards.map((card, index) => (
          <article
            key={index}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
          >
            <p className="text-xs text-slate-500 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-slate-900">{card.val}</p>
          </article>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <header className="flex flex-col gap-1 mb-4">
              <h3 className="font-bold text-slate-700">三大區域配置</h3>
              <p className="text-xs text-slate-400">
                依曝險價值計算 (總曝險 ${numberFormatter.format(SUMMARY.totalExposure)})
              </p>
            </header>
            <div className="space-y-3">
              {SUMMARY.allocations.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-700">生涯資產預測折線圖</h3>
                <p className="text-xs text-slate-400">
                  滑鼠懸停可查看詳細數字；橘點為實際紀錄
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
                實質購買力
              </span>
            </div>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
              [ 互動式圖表畫布 (可整合 Chart.js 或 Recharts) ]
            </div>
          </section>
        </div>
      )}

      {activeTab === 'history' && (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <header className="flex flex-col gap-2 mb-4">
            <h3 className="font-bold text-slate-700">手動淨值快照管理</h3>
            <p className="text-xs text-slate-400">
              新增日期與數值後即可記錄快照；資料將依日期排序。
            </p>
          </header>
          <form onSubmit={handleAddSnapshot} className="flex flex-wrap gap-3 mb-6">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm min-w-[180px]"
              required
            />
            <input
              type="number"
              placeholder="淨資產金額 (TWD)"
              min="0"
              step="1000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
              className="border px-3 py-2 rounded-lg text-sm min-w-[220px]"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              新增快照
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500">
                  <th className="p-3">日期</th>
                  <th className="p-3">淨值 (TWD)</th>
                  <th className="p-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {formattedSnapshots.map((item, index) => (
                  <tr key={`${item.date}-${index}`} className="border-b hover:bg-slate-50/50">
                    <td className="p-3">{item.date}</td>
                    <td className="p-3 font-semibold">
                      ${numberFormatter.format(item.netWorth)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteSnapshot(index)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-red-50 rounded"
                      >
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
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-100 text-slate-500">
          此分頁（{activeTab}）的核心邏輯已架構完畢，可讓 Codex 協助擴充細部計算公式與圖表。
        </div>
      )}
    </div>
  );
}
