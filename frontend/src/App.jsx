import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import './index.css'

// ─── Contract Config ──────────────────────────────────────────────────────────
// Replace with your deployed address after running: npm run deploy:local
const FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const FACTORY_ABI = [
  'function createPool(string _name, uint256 _contributionAmount, uint256 _cycleDuration, uint256 _maxMembers) returns (address)',
  'function getAllPools() view returns (address[])',
  'function getTotalPools() view returns (uint256)',
  'event PoolDeployed(address indexed pool, address indexed creator, string name, uint256 contributionAmount, uint256 cycleDuration, uint256 maxMembers)',
]

const POOL_ABI = [
  'function name() view returns (string)',
  'function contributionAmount() view returns (uint256)',
  'function cycleDuration() view returns (uint256)',
  'function maxMembers() view returns (uint256)',
  'function admin() view returns (address)',
  'function status() view returns (uint8)',
  'function currentRound() view returns (uint256)',
  'function isMember(address) view returns (bool)',
  'function hasWon(address) view returns (bool)',
  'function pendingWithdrawals(address) view returns (uint256)',
  'function roundWinner(uint256) view returns (address)',
  'function join()',
  'function contribute() payable',
  'function withdraw()',
  'function getMembersCount() view returns (uint256)',
  'function getMembers() view returns (address[])',
  'function getMemberStatus(address member) view returns (bool, bool, bool, uint256)',
  'function getPoolInfo() view returns (string, uint256, uint256, uint256, uint256, uint8, uint256, uint256)',
  'function getRoundInfo() view returns (uint256, uint256, uint256, uint256, address)',
]

const STATUS_MAP = { 0: 'Open', 1: 'Active', 2: 'Completed', 3: 'Cancelled' }
const STATUS_CLASS = { 0: 'status-open', 1: 'status-active', 2: 'status-completed', 3: 'status-cancelled' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (wei) => parseFloat(ethers.formatEther(wei)).toFixed(4)
const shortAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '—'
const cycleDays = (sec) => Math.round(Number(sec) / 86400)

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Create Pool Modal ────────────────────────────────────────────────────────
function CreatePoolModal({ onClose, onCreated, signer }) {
  const [form, setForm] = useState({ name: '', amount: '0.01', days: '7', members: '5' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    if (!signer) return
    setLoading(true)
    try {
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer)
      const tx = await factory.createPool(
        form.name,
        ethers.parseEther(form.amount),
        parseInt(form.days) * 86400,
        parseInt(form.members)
      )
      await tx.wait()
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✨ Create Savings Circle</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Circle Name</label>
            <input className="form-input" placeholder="e.g. Lagos Friends Circle" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contribution per Round (ETH)</label>
            <input className="form-input" type="number" step="0.001" min="0.001" placeholder="0.01" value={form.amount} onChange={set('amount')} required />
            <span className="form-hint">Each member pays this amount every round</span>
          </div>
          <div className="form-group">
            <label className="form-label">Cycle Duration (Days)</label>
            <input className="form-input" type="number" min="1" placeholder="7" value={form.days} onChange={set('days')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Members</label>
            <input className="form-input" type="number" min="2" max="20" placeholder="5" value={form.members} onChange={set('members')} required />
            <span className="form-hint">Also equals the number of rounds. Each member wins once.</span>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !signer}>
              {loading ? <><span className="spinner"/> Creating…</> : '🚀 Create Circle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Pool Card ────────────────────────────────────────────────────────────────
function PoolCard({ pool, onClick }) {
  const fillPct = pool.maxMembers > 0
    ? Math.round((pool.currentMembers / pool.maxMembers) * 100)
    : 0

  return (
    <div className="pool-card" onClick={onClick}>
      <div className="pool-card-header">
        <div className="pool-name">{pool.name}</div>
        <span className={`pool-status-badge ${STATUS_CLASS[pool.status]}`}>
          {STATUS_MAP[pool.status]}
        </span>
      </div>

      <div className="pool-progress">
        <div className="progress-label">
          <span>Members</span>
          <span>{pool.currentMembers} / {pool.maxMembers}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <div className="pool-meta">
        <div className="pool-meta-row">
          <span className="pool-meta-label">💰 Contribution</span>
          <span className="pool-meta-value">{fmt(pool.contributionAmount)} ETH</span>
        </div>
        <div className="pool-meta-row">
          <span className="pool-meta-label">📅 Cycle</span>
          <span className="pool-meta-value">{cycleDays(pool.cycleDuration)} days</span>
        </div>
        <div className="pool-meta-row">
          <span className="pool-meta-label">🏆 Pot per Round</span>
          <span className="pool-meta-value" style={{ color: 'var(--gold)' }}>
            {fmt(BigInt(pool.contributionAmount) * BigInt(pool.maxMembers))} ETH
          </span>
        </div>
        {pool.status === 1 && (
          <div className="pool-meta-row">
            <span className="pool-meta-label">🔄 Current Round</span>
            <span className="pool-meta-value">{pool.currentRound} / {pool.maxMembers}</span>
          </div>
        )}
      </div>

      <div className="pool-card-footer">
        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onClick() }}>
          View Details →
        </button>
      </div>
    </div>
  )
}

// ─── Pool Detail View ─────────────────────────────────────────────────────────
function PoolDetail({ poolAddress, account, signer, onBack, addToast }) {
  const [info, setInfo]       = useState(null)
  const [members, setMembers] = useState([])
  const [myStatus, setMy]     = useState(null)
  const [roundInfo, setRound] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const pool     = new ethers.Contract(poolAddress, POOL_ABI, provider)
    const [name, contribAmt, cycleDur, maxM, curM, status, curRnd, bal] = await pool.getPoolInfo()
    setInfo({ name, contributionAmount: contribAmt, cycleDuration: cycleDur, maxMembers: maxM, currentMembers: curM, status: Number(status), currentRound: curRnd, balance: bal })
    setMembers(await pool.getMembers())
    const [rnd, contribs, rndStart, timeLeft, winner] = await pool.getRoundInfo()
    setRound({ round: rnd, contribs, rndStart, timeLeft, winner })
    if (account) {
      const [isMem, hasCont, hasWon, pending] = await pool.getMemberStatus(account)
      setMy({ isMem, hasCont, hasWon, pending })
    }
  }, [poolAddress, account])

  useEffect(() => { load() }, [load])

  async function handleJoin() {
    setLoading(true)
    try {
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer)
      const tx = await pool.join()
      await tx.wait()
      addToast('Joined successfully! 🎉', 'success')
      load()
    } catch (err) {
      addToast(err.reason || 'Transaction failed', 'error')
    } finally { setLoading(false) }
  }

  async function handleContribute() {
    setLoading(true)
    try {
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer)
      const tx = await pool.contribute({ value: info.contributionAmount })
      await tx.wait()
      addToast('Contribution sent! 💸', 'success')
      load()
    } catch (err) {
      addToast(err.reason || 'Transaction failed', 'error')
    } finally { setLoading(false) }
  }

  async function handleWithdraw() {
    setLoading(true)
    try {
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer)
      const tx = await pool.withdraw()
      await tx.wait()
      addToast('Withdrawn successfully! 💰', 'success')
      load()
    } catch (err) {
      addToast(err.reason || 'Transaction failed', 'error')
    } finally { setLoading(false) }
  }

  if (!info) return (
    <div className="page pool-detail">
      <div className="container">
        <div className="empty-state"><div className="spinner" style={{width:40,height:40,margin:'0 auto'}}/></div>
      </div>
    </div>
  )

  const fillPct = Math.round((Number(info.currentMembers) / Number(info.maxMembers)) * 100)
  const pendingEth = myStatus ? fmt(myStatus.pending) : '0'

  return (
    <div className="page pool-detail">
      <div className="container">
        <button className="btn btn-ghost back-btn" onClick={onBack}>← Back to Pools</button>

        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 800 }}>{info.name}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4, fontFamily: 'monospace' }}>{poolAddress}</div>
          </div>
          <span className={`pool-status-badge ${STATUS_CLASS[info.status]}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {STATUS_MAP[info.status]}
          </span>
        </div>

        {/* Action buttons */}
        {account && myStatus && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {info.status === 0 && !myStatus.isMem && (
              <button className="btn btn-primary btn-lg" onClick={handleJoin} disabled={loading}>
                {loading ? <><span className="spinner"/> Joining…</> : '🤝 Join Circle'}
              </button>
            )}
            {info.status === 1 && myStatus.isMem && !myStatus.hasCont && (
              <button className="btn btn-gold btn-lg" onClick={handleContribute} disabled={loading}>
                {loading ? <><span className="spinner"/> Sending…</> : `💸 Contribute ${fmt(info.contributionAmount)} ETH`}
              </button>
            )}
            {myStatus.pending > 0n && (
              <button className="btn btn-primary btn-lg" onClick={handleWithdraw} disabled={loading}>
                {loading ? <><span className="spinner"/> Withdrawing…</> : `🏆 Withdraw ${pendingEth} ETH`}
              </button>
            )}
          </div>
        )}

        <div className="detail-grid">
          {/* Pool Info */}
          <div className="detail-card">
            <div className="detail-card-title">Pool Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['💰 Contribution', `${fmt(info.contributionAmount)} ETH`],
                ['🏆 Total Pot per Round', `${fmt(BigInt(info.contributionAmount) * BigInt(info.maxMembers))} ETH`],
                ['📅 Cycle Duration', `${cycleDays(info.cycleDuration)} days`],
                ['👥 Max Members', String(info.maxMembers)],
                ['💼 Contract Balance', `${fmt(info.balance)} ETH`],
              ].map(([label, value]) => (
                <div className="pool-meta-row" key={label}>
                  <span className="pool-meta-label">{label}</span>
                  <span className="pool-meta-value">{value}</span>
                </div>
              ))}
              <div className="pool-progress" style={{ marginTop: 8 }}>
                <div className="progress-label">
                  <span>Members Joined</span>
                  <span>{String(info.currentMembers)} / {String(info.maxMembers)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${fillPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Round Info */}
          {info.status === 1 && roundInfo && (
            <div className="detail-card">
              <div className="detail-card-title">Current Round</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['🔄 Round', `${String(roundInfo.round)} of ${String(info.maxMembers)}`],
                  ['✅ Contributions', `${String(roundInfo.contribs)} / ${String(info.maxMembers)}`],
                  ['⏱ Time Left', Number(roundInfo.timeLeft) > 0 ? `${Math.ceil(Number(roundInfo.timeLeft) / 3600)}h` : 'Ended'],
                ].map(([label, value]) => (
                  <div className="pool-meta-row" key={label}>
                    <span className="pool-meta-label">{label}</span>
                    <span className="pool-meta-value">{value}</span>
                  </div>
                ))}
                <div className="pool-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.round((Number(roundInfo.contribs) / Number(info.maxMembers)) * 100)}%` }} />
                  </div>
                </div>
                {myStatus && (
                  <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: myStatus.hasCont ? 'var(--green-glow)' : 'var(--purple-glow)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {myStatus.hasCont ? '✅ You have contributed this round' : myStatus.isMem ? '⏳ Your contribution pending' : '👀 You are not a member'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="detail-card" style={{ gridColumn: info.status !== 1 ? '1 / -1' : undefined }}>
            <div className="detail-card-title">Members ({members.length})</div>
            <div className="members-list">
              {members.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No members yet.</div>}
              {members.map((addr, i) => (
                <div className="member-row" key={addr}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: 8 }}>#{i + 1}</span>
                  <span className="member-addr">{shortAddr(addr)}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {account && addr.toLowerCase() === account.toLowerCase() && (
                      <span className="member-badge badge-you">You</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [account, setAccount]     = useState(null)
  const [signer, setSigner]       = useState(null)
  const [pools, setPools]         = useState([])
  const [poolsData, setPoolsData] = useState([])
  const [loading, setLoading]     = useState(false)
  const [showCreate, setCreate]   = useState(false)
  const [selected, setSelected]   = useState(null)
  const [toasts, setToasts]       = useState([])
  const [view, setView]           = useState('home') // 'home' | 'detail'

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  async function connectWallet() {
    if (!window.ethereum) { addToast('Please install MetaMask', 'error'); return }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const sig = await provider.getSigner()
      setAccount(await sig.getAddress())
      setSigner(sig)
      addToast('Wallet connected!', 'success')
    } catch (err) { addToast('Connection rejected', 'error') }
  }

  const loadPools = useCallback(async () => {
    if (!window.ethereum) return
    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const factory  = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider)
      const addrs    = await factory.getAllPools()
      setPools(addrs)

      const data = await Promise.all(
        addrs.map(async (addr) => {
          const pool = new ethers.Contract(addr, POOL_ABI, provider)
          const [name, contribAmt, cycleDur, maxM, curM, status, curRnd, bal] = await pool.getPoolInfo()
          return { address: addr, name, contributionAmount: contribAmt, cycleDuration: cycleDur, maxMembers: maxM, currentMembers: curM, status: Number(status), currentRound: curRnd, balance: bal }
        })
      )
      setPoolsData(data)
    } catch (err) {
      console.error(err)
      addToast('Could not load pools — is the local node running?', 'info')
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { loadPools() }, [loadPools])

  function openDetail(addr) { setSelected(addr); setView('detail') }
  function backToHome()     { setSelected(null);  setView('home');   loadPools() }

  if (view === 'detail' && selected) {
    return (
      <div className="app">
        <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/>
        <nav className="navbar">
          <div className="nav-logo"><div className="nav-logo-icon">🔗</div>EsusuChain</div>
          <div className="nav-right">
            {account
              ? <div className="wallet-btn connected"><div className="wallet-dot"/>{shortAddr(account)}</div>
              : <button className="wallet-btn" onClick={connectWallet}>Connect Wallet</button>
            }
          </div>
        </nav>
        <PoolDetail poolAddress={selected} account={account} signer={signer} onBack={backToHome} addToast={addToast} />
        <ToastContainer toasts={toasts} />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/>

      <nav className="navbar">
        <div className="nav-logo"><div className="nav-logo-icon">🔗</div>EsusuChain</div>
        <div className="nav-links">
          <button className="nav-link active">Pools</button>
          <a className="nav-link" href="https://github.com/Sayo-codes/EsusuChain" target="_blank" rel="noreferrer">GitHub</a>
          <a className="nav-link" href="https://github.com/Sayo-codes/EsusuChain#readme" target="_blank" rel="noreferrer">Docs</a>
        </div>
        <div className="nav-right">
          {account
            ? <div className="wallet-btn connected"><div className="wallet-dot"/>{shortAddr(account)}</div>
            : <button className="wallet-btn" onClick={connectWallet}>🦊 Connect Wallet</button>
          }
        </div>
      </nav>

      <div className="page">
        <div className="container">
          {/* Hero */}
          <section className="hero">
            <div className="hero-badge">🌍 African DeFi · Built on Ethereum</div>
            <h1>Trustless Savings<br/><span className="gradient-text">Circles On-Chain</span></h1>
            <p className="hero-sub">
              EsusuChain brings the traditional African <em>Esusu</em> savings model to the blockchain —
              transparent, automated, and fully decentralized. No banks. No middlemen. Just community.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={account ? () => setCreate(true) : connectWallet}>
                {account ? '✨ Create a Circle' : '🦊 Connect Wallet to Start'}
              </button>
              <a className="btn btn-ghost btn-lg" href="https://github.com/Sayo-codes/EsusuChain#readme" target="_blank" rel="noreferrer">
                📖 Read the Docs
              </a>
            </div>
          </section>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-value">{poolsData.length}</div>
              <div className="stat-label">Total Circles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{poolsData.filter(p => p.status === 1).length}</div>
              <div className="stat-label">Active Now</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{poolsData.reduce((s,p) => s + Number(p.currentMembers), 0)}</div>
              <div className="stat-label">Members Saving</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {parseFloat(ethers.formatEther(poolsData.reduce((s,p) => s + p.balance, 0n))).toFixed(3)} ETH
              </div>
              <div className="stat-label">Total Value Locked</div>
            </div>
          </div>

          {/* Pools */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">💎 Savings Circles</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={loadPools} disabled={loading}>
                  {loading ? <span className="spinner"/> : '🔄 Refresh'}
                </button>
                {account && (
                  <button className="btn btn-primary" onClick={() => setCreate(true)}>
                    + Create Circle
                  </button>
                )}
              </div>
            </div>

            {loading && poolsData.length === 0 ? (
              <div className="empty-state">
                <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
                <div className="empty-title">Loading pools…</div>
              </div>
            ) : poolsData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <div className="empty-title">No circles yet</div>
                <div className="empty-sub">Be the first to create a savings circle on EsusuChain!</div>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={account ? () => setCreate(true) : connectWallet}>
                  {account ? 'Create First Circle' : 'Connect Wallet'}
                </button>
              </div>
            ) : (
              <div className="pool-grid">
                {poolsData.map(pool => (
                  <PoolCard key={pool.address} pool={pool} onClick={() => openDetail(pool.address)} />
                ))}
              </div>
            )}
          </section>

          {/* How it works */}
          <section className="section" style={{ paddingBottom: 80 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>⚡ How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
              {[
                ['1️⃣', 'Create', 'Set a name, contribution amount, cycle length, and member count. The circle is deployed as a smart contract.'],
                ['2️⃣', 'Join', 'Members join until the circle is full. It activates automatically.'],
                ['3️⃣', 'Contribute', 'Each round, every member contributes their share to the pot.'],
                ['4️⃣', 'Win', 'One member collects the full pot each round, rotating until everyone has won.'],
              ].map(([icon, title, desc]) => (
                <div className="detail-card" key={title}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showCreate && (
        <CreatePoolModal
          signer={signer}
          onClose={() => setCreate(false)}
          onCreated={() => { loadPools(); addToast('Circle created! 🎉', 'success') }}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
