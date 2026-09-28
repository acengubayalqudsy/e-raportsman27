import { spawn, execFileSync } from 'node:child_process'
import { existsSync, readFileSync, openSync, closeSync, unlinkSync, writeFileSync } from 'node:fs'
import { createConnection, isIPv4 } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const backend = join(root, 'backend')
const xampp = process.env.XAMPP_HOME || 'C:\\xampp'
const php = process.env.PHP_BINARY || (process.platform === 'win32' && existsSync(join(xampp, 'php/php.exe'))
  ? join(xampp, 'php/php.exe') : 'php')

function probeDatabase(mode = 'check') {
  try {
    return JSON.parse(execFileSync(php, [join(backend, 'scripts/dev-database.php'), mode], {
      cwd: backend, encoding: 'utf8', windowsHide: true, timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'],
    }))
  } catch (error) {
    if (error.stdout) {
      try { return JSON.parse(error.stdout) } catch { /* Show a safe diagnostic below. */ }
    }
    throw new Error('Pemeriksaan database gagal. Pastikan PHP 8.2+, backend/vendor, dan backend/.env tersedia.')
  }
}

export async function ensureDatabase({ probe = probeDatabase, start = startXampp, log = console.log,
  pause = delay, attempts = 30 } = {}) {
  let state = probe()
  if (state.ok) return state
  if (state.code !== 'connection_refused') throw new Error(state.message)
  const target = state.failedConnection || state
  if (!['mysql', 'mariadb'].includes(target.driver) || !['127.0.0.1', 'localhost', '::1'].includes(target.host)) {
    throw new Error(state.message + ' Nyalakan database pada host yang dikonfigurasi.')
  }
  log('[..] Menyalakan MariaDB XAMPP dan menunggu koneksi database...')
  await start(target)
  const deadline = Date.now() + 30000
  for (let attempt = 0; attempt < attempts && Date.now() < deadline; attempt++) {
    await pause(1000)
    state = probe()
    if (state.ok) return state
    if (state.code !== 'connection_refused') throw new Error(state.message)
  }
  throw new Error('MariaDB belum siap. Periksa XAMPP Control Panel dan mysql/data/mysql_error.log. ' + state.message)
}

async function startXampp(target) {
  if (process.platform !== 'win32') {
    throw new Error('Nyalakan layanan MariaDB/MySQL lokal terlebih dahulu, lalu jalankan npm run dev kembali.')
  }
  if (await portOpen(target.host, Number(target.port))) return
  const executable = join(xampp, 'mysql/bin/mysqld.exe')
  const config = join(xampp, 'mysql/bin/my.ini')
  if (!existsSync(executable) || !existsSync(config)) {
    throw new Error('XAMPP tidak ditemukan. Atur XAMPP_HOME ke folder instalasi atau nyalakan database secara manual.')
  }
  const section = readFileSync(config, 'utf8').split(/^\[mysqld\]\s*$/m)[1]?.split(/^\[/m)[0]
  const port = Number(section?.match(/^\s*port\s*=\s*(\d+)/m)?.[1] || 3306)
  if (port !== Number(target.port)) {
    throw new Error(`Port database (${target.port}) berbeda dari XAMPP (${port}). Sesuaikan konfigurasi sebelum startup.`)
  }
  // Detached: closing the editor/terminal must not terminate the database mid-write.
  const child = spawn(executable, [`--defaults-file=${config}`, '--standalone'], {
    cwd: xampp, windowsHide: true, detached: true, stdio: 'ignore',
  })
  await new Promise((resolveSpawn, reject) => {
    child.once('spawn', resolveSpawn)
    child.once('error', () => reject(new Error('MariaDB tidak dapat dinyalakan. Periksa izin XAMPP Control Panel.')))
  })
  child.unref()
}

async function portOpen(host, port) {
  return new Promise(resolvePort => {
    const socket = createConnection({ host, port })
    const finish = value => { socket.destroy(); resolvePort(value) }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(1000, () => finish(false))
  })
}

async function responds(url, status, marker) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000), redirect: 'manual' })
    const body = await response.text()
    return response.status === status && (!marker || body.includes(marker))
  } catch { return false }
}

export async function waitForReady(ready, { attempts = 5, pause = delay, interval = 500 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (await ready()) return true
    if (attempt + 1 < attempts) await pause(interval)
  }
  return false
}

function isPrivateIPv4(address) {
  if (!isIPv4(address)) return false
  const [first, second] = address.split('.').map(Number)
  return first === 10 || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
}

export function selectLanHost(interfaces, preferredHost) {
  if (preferredHost) {
    if (!isPrivateIPv4(preferredHost)) {
      throw new Error('LAN_HOST harus berupa alamat IPv4 privat jaringan lokal, misalnya 192.168.1.7.')
    }
    return preferredHost
  }

  const candidates = Object.entries(interfaces)
    .filter(([name]) => !/loopback|vmware|virtual|vbox|hyper-v|vpn|tunnel|bluetooth/i.test(name))
    .flatMap(([name, addresses]) => (addresses || [])
      .filter(address => address.family === 'IPv4' && isPrivateIPv4(address.address))
      .map(address => ({ name, address: address.address })))
  const selected = candidates.find(candidate => /wi-?fi|wireless/i.test(candidate.name))
    || candidates.find(candidate => /ethernet/i.test(candidate.name))
    || candidates[0]
  if (!selected) {
    throw new Error('Alamat IPv4 Wi-Fi tidak ditemukan. Sambungkan komputer ke Wi-Fi atau jalankan dengan LAN_HOST=alamat_IP.')
  }
  return selected.address
}

function acquireStartupLock() {
  const path = join(backend, 'storage/logs/dev-start.lock')
  if (existsSync(path)) {
    const pid = Number(readFileSync(path, 'utf8'))
    if (Number.isInteger(pid) && pid > 0) {
      let alive = true
      try { process.kill(pid, 0) } catch (error) { if (error.code === 'ESRCH') alive = false }
      if (alive) throw new Error('Startup lain masih berjalan. Tunggu sampai muncul [SIAP] E-Raport.')
    }
    unlinkSync(path)
  }
  const file = openSync(path, 'wx')
  writeFileSync(file, String(process.pid))
  closeSync(file)
  return () => { if (existsSync(path)) unlinkSync(path) }
}

async function main() {
  console.log('[MULAI] E-Raport - memeriksa layanan lokal...')
  const checkOnly = process.argv.includes('--check')
  const lanMode = process.argv.includes('--lan')
  const owned = []
  let releaseLock
  let stopping = false
  const stop = () => {
    stopping = true
    for (const child of owned) {
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue
      if (process.platform === 'win32') {
        try { execFileSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' }) } catch { /* Already stopped. */ }
      } else {
        try { process.kill(-child.pid, 'SIGTERM') } catch { /* Already stopped. */ }
      }
    }
    releaseLock?.()
    releaseLock = undefined
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { stop(); process.exit(0) })
  process.once('exit', stop)

  try {
    if (!existsSync(join(backend, '.env')) || !existsSync(join(backend, 'vendor/autoload.php'))) {
      throw new Error('Lengkapi backend/.env dan jalankan composer install di folder backend terlebih dahulu.')
    }
    let info = probeDatabase('info')
    if (!info.ok) throw new Error(info.message)
    if (info.environment !== 'local') throw new Error('Starter ini hanya untuk APP_ENV=local.')
    if (checkOnly) {
      const state = probeDatabase()
      if (!state.ok) throw new Error(state.message)
      console.log(`[OK] Database ${state.database} dan penyimpanan sesi siap.`)
      return
    }
    if (!existsSync(join(root, 'node_modules/vite/bin/vite.js'))) {
      throw new Error('Dependency frontend belum tersedia. Jalankan npm install terlebih dahulu.')
    }
    releaseLock = acquireStartupLock()
    try {
      execFileSync(php, ['artisan', 'config:clear', '--no-ansi'], {
        cwd: backend, windowsHide: true, stdio: 'pipe', timeout: 20000,
      })
    } catch {
      throw new Error('Cache konfigurasi lokal gagal dibersihkan. Periksa izin backend/bootstrap/cache dan konfigurasi Laravel.')
    }
    info = probeDatabase('info')
    if (!info.ok) throw new Error(info.message)
    const api = new URL(info.backendUrl)
    if (api.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(api.hostname) || api.pathname !== '/') {
      throw new Error('APP_URL untuk starter lokal harus berbentuk http://localhost:8000 atau http://127.0.0.1:8000.')
    }
    const apiPort = Number(api.port || 80)
    const lanHost = lanMode ? selectLanHost(networkInterfaces(), process.env.LAN_HOST) : null
    const apiOrigin = lanMode ? `http://${lanHost}:${apiPort}` : api.origin
    const frontendOrigin = lanMode ? `http://${lanHost}:5173` : 'http://localhost:5173'
    const { loadEnv } = await import('vite')
    const frontendEnv = loadEnv('development', root, 'VITE_')
    const configuredApi = new URL(lanMode
      ? apiOrigin
      : process.env.VITE_API_BASE_URL || frontendEnv.VITE_API_BASE_URL || 'http://localhost:8000')
    if (configuredApi.origin !== apiOrigin) {
      throw new Error('Samakan VITE_API_BASE_URL di .env.local dengan APP_URL di backend/.env agar koneksi login sesuai.')
    }
    const database = await ensureDatabase()
    console.log(`[OK] Database ${database.database} dan penyimpanan sesi siap.`)

    async function ensureServer(name, host, port, ready, command, args, cwd, env = process.env) {
      if (await portOpen(host, port)) {
        if (!(await waitForReady(ready))) {
          const hint = lanMode
            ? ' Hentikan server lama dengan Ctrl+C, lalu jalankan npm run dev:lan.'
            : ' Periksa terminal layanan tersebut.'
          throw new Error(`${name}: port ${port} sedang dipakai layanan yang tidak siap/sesuai.${hint}`)
        }
        console.log(`[OK] ${name} sudah aktif pada port ${port}.`)
        return
      }
      console.log(`[..] Menjalankan ${name} pada port ${port}...`)
      const child = spawn(command, args, {
        cwd, env, windowsHide: true, detached: process.platform !== 'win32',
        stdio: ['ignore', 'inherit', 'inherit'],
      })
      owned.push(child)
      let failed = false
      child.once('error', () => { failed = true })
      for (let attempt = 0; attempt < 30; attempt++) {
        if (failed || child.exitCode !== null || child.signalCode !== null) throw new Error(`${name} gagal dijalankan. Periksa pesan di atas.`)
        if (await ready()) return
        await delay(500)
      }
      throw new Error(`${name} belum siap setelah batas waktu startup. Periksa pesan di atas.`)
    }

    const backendEnv = lanMode ? {
      ...process.env,
      APP_URL: apiOrigin,
      FRONTEND_URL: frontendOrigin,
      SANCTUM_STATEFUL_DOMAINS: `localhost,localhost:5173,127.0.0.1,127.0.0.1:5173,${lanHost},${lanHost}:5173`,
      SESSION_DOMAIN: '',
      SESSION_SECURE_COOKIE: 'false',
      SESSION_SAME_SITE: 'lax',
    } : process.env
    const frontendProcessEnv = lanMode
      ? { ...process.env, VITE_API_BASE_URL: apiOrigin }
      : process.env

    await ensureServer('Laravel', '127.0.0.1', apiPort,
      async () => await responds(`${apiOrigin}/`, 200) && await responds(`${apiOrigin}/sanctum/csrf-cookie`, 204),
      php, ['artisan', 'serve', `--host=${lanMode ? '0.0.0.0' : '127.0.0.1'}`, `--port=${apiPort}`, '--tries=1', '--no-reload'], backend, backendEnv)
    await ensureServer('Vite', '127.0.0.1', 5173,
      () => responds(`${frontendOrigin}/@vite/client`, 200, 'createHotContext'),
      process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), `--host=${lanMode ? '0.0.0.0' : 'localhost'}`, '--port=5173', '--strictPort'], root, frontendProcessEnv)

    // A server can exit while the other one is still starting.
    if (owned.some(child => child.exitCode !== null || child.signalCode !== null)
      || !(await waitForReady(() => responds(`${apiOrigin}/sanctum/csrf-cookie`, 204)))) {
      throw new Error('Backend/frontend berhenti saat startup. Periksa pesan layanan di atas.')
    }
    releaseLock()
    releaseLock = undefined
    console.log(`[SIAP] E-Raport: ${frontendOrigin} | Backend: ${apiOrigin}`)
    if (owned.length) console.log('Biarkan terminal ini aktif. Ctrl+C menghentikan server yang dijalankan starter ini; MariaDB tetap aktif.')
    for (const child of owned) {
      child.once('exit', () => {
        if (!stopping) {
          console.error('[GAGAL] Salah satu server berhenti. Jalankan npm run dev kembali.')
          stop()
          process.exitCode = 1
        }
      })
    }
  } catch (error) {
    stop()
    console.error(`[GAGAL] ${error.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
