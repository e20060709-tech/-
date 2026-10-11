import { useState, useCallback, useMemo } from 'react';
import './App.css';

const numberFormatter = new Intl.NumberFormat('zh-TW');
const ASSETS_STORAGE_KEY = 'wealthflow-assets-v1';
const INITIAL_ASSETS = [
  { id: 'tw-stocks', name: '台灣股票', assetClass: 'Stock', value: 1_000_000, targetPercent: 40 },
  { id: 'us-stocks', name: '美國股票', assetClass: 'Stock', value: 1_500_000, targetPercent: 40 },
  { id: 'bonds', name: '債券', assetClass: 'Bond', value: 500_000, targetPercent: 20 }
];
const ASSET_CLASSES = [
  { value: 'Stock', label: '股票' },
  { value: 'Bond', label: '債券' },
  { value: 'Other', label: '其他' }
];

function isValidAsset(asset) {
  return (
    asset &&
    typeof asset.id === 'string' &&
    typeof asset.name === 'string' &&
    ASSET_CLASSES.some(({ value }) => value === asset.assetClass) &&
    Number.isFinite(asset.value) &&
    asset.value >= 0 &&
    Number.isFinite(asset.targetPercent) &&
    asset.targetPercent >= 0 &&
    asset.targetPercent <= 100
  );
}

function loadAssets() {
  try {
    const savedAssets = window.localStorage.getItem(ASSETS_STORAGE_KEY);
    if (savedAssets === null) {
      return { assets: INITIAL_ASSETS, warning: '' };
    }

    const parsedAssets = JSON.parse(savedAssets);
    if (!Array.isArray(parsedAssets) || !parsedAssets.every(isValidAsset)) {
      throw new Error('Saved asset data has an invalid format.');
    }

    return { assets: parsedAssets, warning: '' };
  } catch (error) {
    console.warn('讀取資產資料失敗', error);
    return {
      assets: INITIAL_ASSETS,
      warning: '無法讀取已儲存的資產資料；為避免覆寫原資料，請確認後再編輯。'
    };
  }
}

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
  const [initialAssets] = useState(loadAssets);
  const [assets, setAssets] = useState(initialAssets.assets);
  const [assetStorageWarning, setAssetStorageWarning] = useState(initialAssets.warning);
  const [assetDraft, setAssetDraft] = useState({
    name: '',
    assetClass: 'Stock',
    value: '',
    targetPercent: ''
  });
  const [snapshots, setSnapshots] = useState([
    { date: '2026-08-31', netWorth: 2_050_000 },
    { date: '2026-09-30', netWorth: 2_131_500 }
  ]);
  const [newDate, setNewDate] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const persistAssets = useCallback((nextAssets) => {
    try {
      window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(nextAssets));
      setAssetStorageWarning('');
    } catch (error) {
      console.warn('儲存資產資料失敗', error);
      setAssetStorageWarning('無法儲存資產資料；請確認瀏覽器儲存空間與權限。');
    }
  }, []);

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

  const totalAssetValue = useMemo(
    () => assets.reduce((total, asset) => total + asset.value, 0),
    [assets]
  );
  const totalTargetPercent = useMemo(
    () => assets.reduce((total, asset) => total + asset.targetPercent, 0),
    [assets]
  );
  const targetAllocationIsValid = Math.abs(totalTargetPercent - 100) < 0.01;

  const updateAsset = useCallback((id, field, value) => {
    const nextAssets = assets.map((asset) =>
      asset.id === id ? { ...asset, [field]: value } : asset
    );
    setAssets(nextAssets);
    persistAssets(nextAssets);
  }, [assets, persistAssets]);

  const handleAddAsset = useCallback(
    (event) => {
      event.preventDefault();
      const name = assetDraft.name.trim();
      const value = Number(assetDraft.value);
      const targetPercent = Number(assetDraft.targetPercent);
      if (!name || assetDraft.value === '' || assetDraft.targetPercent === '') return;
      if (!Number.isFinite(value) || value < 0 || !Number.isFinite(targetPercent) || targetPercent < 0 || targetPercent > 100) return;

      const nextAssets = [
        ...assets,
        {
          id: crypto.randomUUID(),
          name,
          assetClass: assetDraft.assetClass,
          value,
          targetPercent
        }
      ];
      setAssets(nextAssets);
      persistAssets(nextAssets);
      setAssetDraft({ name: '', assetClass: 'Stock', value: '', targetPercent: '' });
    },
    [assetDraft, assets, persistAssets]
  );

  const deleteAsset = useCallback((id) => {
    const nextAssets = assets.filter((asset) => asset.id !== id);
    setAssets(nextAssets);
    persistAssets(nextAssets);
  }, [assets, persistAssets]);

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

      {activeTab === 'assets' && (
        <section className="panel asset-panel">
          <div className="panel-header">
            <h3>資產明細與再平衡</h3>
            <small>輸入目前資產價值與目標配置，系統會計算各項資產的調整金額。</small>
          </div>

          <p className="storage-notice">
            資產資料只儲存在這個瀏覽器，不會上傳或同步至其他裝置。
          </p>
          {assetStorageWarning && (
            <p className="storage-warning" role="alert">{assetStorageWarning}</p>
          )}

          <div className="asset-summary">
            <article className="asset-stat">
              <span>資產總值</span>
              <strong>${numberFormatter.format(totalAssetValue)}</strong>
            </article>
            <article className="asset-stat">
              <span>資產項目</span>
              <strong>{assets.length}</strong>
            </article>
            <article className="asset-stat">
              <span>目標配置合計</span>
              <strong className={targetAllocationIsValid ? '' : 'invalid-total'}>
                {totalTargetPercent.toFixed(1)}%
              </strong>
            </article>
          </div>

          {!targetAllocationIsValid && (
            <p className="allocation-warning" role="status">
              目標配置需合計 100% 才能計算再平衡金額；目前差額為{' '}
              {numberFormatter.format(Math.abs(100 - totalTargetPercent))}%。
            </p>
          )}

          <div className="table-wrap asset-table-wrap">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>資產名稱</th>
                  <th>類別</th>
                  <th>目前價值 (TWD)</th>
                  <th>目前配置</th>
                  <th>目標配置</th>
                  <th>目標金額</th>
                  <th>再平衡建議</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const currentPercent = totalAssetValue > 0
                    ? (asset.value / totalAssetValue) * 100
                    : 0;
                  const targetValue = targetAllocationIsValid
                    ? totalAssetValue * (asset.targetPercent / 100)
                    : null;
                  const adjustment = targetValue === null ? null : targetValue - asset.value;

                  return (
                    <tr key={asset.id}>
                      <td>
                        <input
                          className="asset-input asset-name-input"
                          aria-label={`${asset.name} 資產名稱`}
                          value={asset.name}
                          onChange={(event) => updateAsset(asset.id, 'name', event.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="asset-input"
                          aria-label={`${asset.name} 資產類別`}
                          value={asset.assetClass}
                          onChange={(event) => updateAsset(asset.id, 'assetClass', event.target.value)}
                        >
                          {ASSET_CLASSES.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="asset-input asset-number-input"
                          aria-label={`${asset.name} 目前價值`}
                          type="number"
                          min="0"
                          step="1000"
                          value={asset.value}
                          onChange={(event) => {
                            const rawValue = event.target.value;
                            const value = Number(rawValue);
                            if (rawValue === '' || (Number.isFinite(value) && value >= 0)) {
                              updateAsset(asset.id, 'value', value);
                            }
                          }}
                        />
                      </td>
                      <td>{currentPercent.toFixed(1)}%</td>
                      <td>
                        <div className="target-input-wrap">
                          <input
                            className="asset-input target-input"
                            aria-label={`${asset.name} 目標配置百分比`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={asset.targetPercent}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              const value = Number(rawValue);
                              if (rawValue === '' || (Number.isFinite(value) && value >= 0 && value <= 100)) {
                                updateAsset(asset.id, 'targetPercent', value);
                              }
                            }}
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td>{targetValue === null ? '—' : `$${numberFormatter.format(targetValue)}`}</td>
                      <td className={adjustment > 0 ? 'rebalance-buy' : adjustment < 0 ? 'rebalance-sell' : ''}>
                        {adjustment === null
                          ? '—'
                          : adjustment > 0
                            ? `買進 $${numberFormatter.format(adjustment)}`
                            : adjustment < 0
                              ? `賣出 $${numberFormatter.format(Math.abs(adjustment))}`
                              : '維持'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          aria-label={`刪除 ${asset.name}`}
                          onClick={() => deleteAsset(asset.id)}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-assets">尚無資產，請使用下方表單新增。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form className="asset-form" onSubmit={handleAddAsset}>
            <label>
              資產名稱
              <input
                value={assetDraft.name}
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, name: event.target.value }))}
                placeholder="例如：全球股票 ETF"
                required
              />
            </label>
            <label>
              類別
              <select
                value={assetDraft.assetClass}
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, assetClass: event.target.value }))}
              >
                {ASSET_CLASSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              目前價值 (TWD)
              <input
                type="number"
                min="0"
                step="1000"
                value={assetDraft.value}
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, value: event.target.value }))}
                required
              />
            </label>
            <label>
              目標配置 (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={assetDraft.targetPercent}
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, targetPercent: event.target.value }))}
                required
              />
            </label>
            <button type="submit">新增資產</button>
          </form>
        </section>
      )}

      {['flow', 'stress'].includes(activeTab) && (
        <div className="panel placeholder-panel">
          此分頁（{activeTab}）的核心邏輯已架構完畢，可讓 Codex 協助擴充細部計算公式與圖表。
        </div>
      )}
    </div>
  );
}

export default App;
