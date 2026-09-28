import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureDatabase, selectLanHost, waitForReady } from './start-dev.mjs'

test('an existing server can become ready after a transient failed probe', async () => {
  let probes = 0
  const pauses = []
  const ready = await waitForReady(() => ++probes === 3, {
    pause: async milliseconds => { pauses.push(milliseconds) },
  })

  assert.equal(ready, true)
  assert.equal(probes, 3)
  assert.deepEqual(pauses, [500, 500])
})

test('a server that never becomes ready stops after the retry limit', async () => {
  let probes = 0
  const ready = await waitForReady(() => { probes++; return false }, {
    attempts: 3,
    pause: async () => {},
  })

  assert.equal(ready, false)
  assert.equal(probes, 3)
})

test('LAN host selection prefers Wi-Fi and ignores virtual adapters', () => {
  const interfaces = {
    'VMware Network Adapter VMnet8': [{ family: 'IPv4', address: '192.168.162.1' }],
    'Wi-Fi': [{ family: 'IPv4', address: '192.168.1.7' }],
    'Local Area Connection': [{ family: 'IPv4', address: '169.254.73.135' }],
  }

  assert.equal(selectLanHost(interfaces), '192.168.1.7')
})

test('LAN host selection accepts a valid private address override', () => {
  assert.equal(selectLanHost({}, '10.0.0.24'), '10.0.0.24')
})

test('LAN host selection rejects public and missing addresses', () => {
  assert.throws(() => selectLanHost({}, '8.8.8.8'), /alamat IPv4 privat/)
  assert.throws(() => selectLanHost({}), /tidak ditemukan/)
})

const refused = {
  ok: false,
  code: 'connection_refused',
  message: 'Koneksi database ditolak.',
  driver: 'mariadb',
  host: '127.0.0.1',
  port: 3306,
  database: 'eraport_test',
}
const ready = { ...refused, ok: true, code: 'ready', message: 'Database siap.' }

function harness(states, overrides = {}) {
  const calls = { probes: 0, starts: [], pauses: [], logs: [] }
  const options = {
    probe() {
      const index = Math.min(calls.probes++, states.length - 1)
      return states[index]
    },
    async start(target) { calls.starts.push(target) },
    async pause(milliseconds) { calls.pauses.push(milliseconds) },
    log(message) { calls.logs.push(message) },
    ...overrides,
  }
  return { calls, options }
}

test('an already ready database needs no launch or delay', async () => {
  const { calls, options } = harness([ready])

  assert.equal(await ensureDatabase(options), ready)
  assert.equal(calls.probes, 1)
  assert.deepEqual(calls.starts, [])
  assert.deepEqual(calls.pauses, [])
})

test('a refused local database starts once and can become ready after more than two seconds', async () => {
  const { calls, options } = harness([refused, refused, refused, refused, ready])

  assert.equal(await ensureDatabase(options), ready)
  assert.deepEqual(calls.starts, [refused])
  assert.equal(calls.probes, 5)
  assert.equal(calls.pauses.reduce((sum, milliseconds) => sum + milliseconds, 0), 4000)
})

test('startup waits for the database launch operation before polling', async () => {
  let launchComplete = false
  const { calls, options } = harness([refused, ready], {
    async start() {
      await Promise.resolve()
      launchComplete = true
    },
    async pause() { assert.equal(launchComplete, true) },
  })

  assert.equal(await ensureDatabase(options), ready)
  assert.equal(calls.probes, 2)
})

test('an unavailable database fails after the configured retry limit', async () => {
  const { calls, options } = harness([refused], { attempts: 3 })

  await assert.rejects(ensureDatabase(options), /MariaDB belum siap.*Koneksi database ditolak/)
  assert.equal(calls.probes, 4)
  assert.deepEqual(calls.starts, [refused])
  assert.deepEqual(calls.pauses, [1000, 1000, 1000])
})

for (const failure of [
  { code: 'auth_error', message: 'Kredensial database tidak valid.' },
  { code: 'database_missing', message: 'Database belum tersedia.' },
  { code: 'session_table_missing', message: 'Tabel sessions belum tersedia.' },
  { code: 'session_schema_error', message: 'Struktur tabel sessions belum sesuai.' },
]) {
  test(`${failure.code} fails immediately without launching or retrying`, async () => {
    const state = { ...refused, ...failure }
    const { calls, options } = harness([state])

    await assert.rejects(ensureDatabase(options), { message: failure.message })
    assert.equal(calls.probes, 1)
    assert.deepEqual(calls.starts, [])
    assert.deepEqual(calls.pauses, [])
  })

  test(`${failure.code} during startup stops further retries`, async () => {
    const state = { ...refused, ...failure }
    const { calls, options } = harness([refused, state, ready])

    await assert.rejects(ensureDatabase(options), { message: failure.message })
    assert.equal(calls.probes, 2)
    assert.deepEqual(calls.starts, [refused])
    assert.deepEqual(calls.pauses, [1000])
  })
}

test('a refused remote database does not launch local MariaDB', async () => {
  const { calls, options } = harness([{ ...refused, host: 'db.example.test' }])

  await assert.rejects(ensureDatabase(options), /Nyalakan database pada host yang dikonfigurasi/)
  assert.equal(calls.probes, 1)
  assert.deepEqual(calls.starts, [])
  assert.deepEqual(calls.pauses, [])
})

test('a failed session connection supplies the database launch target', async () => {
  const sessionConnection = { driver: 'mariadb', host: '127.0.0.1', port: 3307, database: 'sessions_test' }
  const state = { ...refused, driver: 'sqlite', host: '', failedConnection: sessionConnection }
  const { calls, options } = harness([state, ready])

  assert.equal(await ensureDatabase(options), ready)
  assert.deepEqual(calls.starts, [sessionConnection])
  assert.equal(calls.probes, 2)
})

test('a remote session connection never starts the local primary database', async () => {
  const state = {
    ...refused,
    failedConnection: { ...refused, host: 'sessions.example.test' },
  }
  const { calls, options } = harness([state])

  await assert.rejects(ensureDatabase(options), /Nyalakan database pada host yang dikonfigurasi/)
  assert.deepEqual(calls.starts, [])
  assert.deepEqual(calls.pauses, [])
})

test('a database launch failure is propagated without polling', async () => {
  const launchError = new Error('MariaDB tidak dapat dinyalakan.')
  const { calls, options } = harness([refused], {
    async start() { throw launchError },
  })

  await assert.rejects(ensureDatabase(options), error => error === launchError)
  assert.equal(calls.probes, 1)
  assert.deepEqual(calls.pauses, [])
})
