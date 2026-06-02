import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = join(rootDir, 'android')

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function hasFile(path) {
  return existsSync(path)
}

function findNewestMatchingDir(baseDir, prefix) {
  if (!isDirectory(baseDir)) {
    return null
  }

  const matches = readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => join(baseDir, entry.name))
    .sort((left, right) => right.localeCompare(left))

  return matches[0] ?? null
}

function parseJdkVersion(path) {
  const match = path.match(/jdk-(\d+)(?:\.|$)/i)
  return match ? Number(match[1]) : 0
}

function resolveJavaHome() {
  const envJavaHome = process.env.JAVA_HOME

  if (envJavaHome && hasFile(join(envJavaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
    return envJavaHome
  }

  const candidateBases = [
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Java',
  ]

  const installedCandidates = []

  for (const baseDir of candidateBases) {
    const candidate = findNewestMatchingDir(baseDir, 'jdk-')
    if (candidate && hasFile(join(candidate, 'bin', 'java.exe'))) {
      installedCandidates.push(candidate)
    }
  }

  installedCandidates.sort((left, right) => parseJdkVersion(right) - parseJdkVersion(left))

  if (installedCandidates[0]) {
    return installedCandidates[0]
  }

  const whereResult = spawnSync('where', ['java'], { encoding: 'utf8', shell: true })

  if (whereResult.status === 0) {
    const firstMatch = whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean)

    if (firstMatch) {
      return dirname(dirname(firstMatch))
    }
  }

  return null
}

function resolveAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate && isDirectory(candidate)) {
      return candidate
    }
  }

  return null
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(' ')
  console.log(`\n> ${printable}`)
  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', printable], {
          cwd: rootDir,
          stdio: 'inherit',
          shell: false,
          ...options,
        })
      : spawnSync(command, args, {
          cwd: rootDir,
          stdio: 'inherit',
          shell: false,
          ...options,
        })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function writeLocalProperties(androidSdk) {
  const content = `sdk.dir=${androidSdk.replace(/\\/g, '\\\\')}\n`
  writeFileSync(join(androidDir, 'local.properties'), content, 'utf8')
}

const javaHome = resolveJavaHome()
const androidSdk = resolveAndroidSdk()
const isDoctorMode = process.argv.includes('--doctor')

if (!javaHome) {
  console.error('Missing Java JDK. Set JAVA_HOME or install JDK 17+.')
  process.exit(1)
}

if (!androidSdk) {
  console.error('Missing Android SDK. Set ANDROID_HOME or ANDROID_SDK_ROOT.')
  process.exit(1)
}

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidSdk,
  ANDROID_SDK_ROOT: androidSdk,
  PATH: [
    join(javaHome, 'bin'),
    join(androidSdk, 'platform-tools'),
    process.env.PATH ?? '',
  ].join(process.platform === 'win32' ? ';' : ':'),
}

if (isDoctorMode) {
  console.log(`JAVA_HOME=${javaHome}`)
  console.log(`ANDROID_HOME=${androidSdk}`)
  console.log(`ANDROID_SDK_ROOT=${androidSdk}`)
  process.exit(0)
}

if (!isDirectory(androidDir)) {
  console.error('Missing android directory. Run "pnpm exec cap add android" first.')
  process.exit(1)
}

writeLocalProperties(androidSdk)
run('pnpm', ['build'], { env })
run('pnpm', ['exec', 'cap', 'sync', 'android'], { env })
run('gradlew.bat', ['assembleDebug'], { cwd: androidDir, env })
