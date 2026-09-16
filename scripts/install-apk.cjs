#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function findAdb() {
  // 1. Check if adb is already on PATH
  try {
    const result = execSync('where.exe adb', { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });
    const p = result.trim().split(/\r?\n/)[0];
    if (p && fs.existsSync(p)) return p;
  } catch {}

  // 2. Check Android SDK from local.properties
  const localPropsPath = path.join(__dirname, '..', 'android', 'local.properties');
  if (fs.existsSync(localPropsPath)) {
    try {
      const content = fs.readFileSync(localPropsPath, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        if (line.startsWith('sdk.dir=')) {
          const sdkDir = line.substring('sdk.dir='.length).trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
          const candidate = path.join(sdkDir, 'platform-tools', 'adb.exe');
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    } catch {}
  }

  // 3. Common fallback locations on Windows
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    'C:\\Program Files (x86)\\Android\\android-sdk\\platform-tools\\adb.exe'
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }

  return null;
}

const adbPath = findAdb();

if (!adbPath) {
  console.error('\n❌ Android ADB executable could not be located automatically.');
  console.error('Please ensure Android Studio / SDK Platform-Tools is installed, or add adb.exe to your PATH.');
  console.error('Expected default location: %LOCALAPPDATA%\\Android\\Sdk\\platform-tools\\adb.exe\n');
  process.exit(1);
}

console.log(`\n🔍 Found ADB at: ${adbPath}`);

// Check connected devices
try {
  const devicesOutput = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
  const lines = devicesOutput.trim().split(/\r?\n/).slice(1).filter(l => l.trim().length > 0);
  
  const connectedDevices = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    return { id: parts[0], status: parts[1] || 'unknown' };
  });

  console.log(`\n📱 Connected Android Devices (${connectedDevices.length}):`);
  if (connectedDevices.length === 0) {
    console.log('   (No devices attached)');
    console.log('\n💡 How to connect your Android device:');
    console.log('   1. USB Cable: Plug your device into your PC.');
    console.log('      - Enable "Developer options" (tap Build number 7 times in Settings > About Phone).');
    console.log('      - Enable "USB debugging" inside Developer options.');
    console.log('      - When prompted on your phone, select "Always allow from this computer".');
    console.log('   2. Wireless Debugging: In Developer Options > Wireless debugging, run:');
    console.log('      adb connect <DEVICE_IP>:<PORT>');
    console.log('   3. Android Emulator: Launch an AVD from Android Studio.\n');
    
    if (process.argv.includes('--devices-only')) {
      process.exit(0);
    }
    process.exit(1);
  }

  connectedDevices.forEach(d => {
    console.log(`   • ${d.id} [${d.status}]`);
  });

  if (process.argv.includes('--devices-only')) {
    process.exit(0);
  }

  const apkPath = path.join(__dirname, '..', 'apk', 'Vyoma_ScanServe_Dashboard_v1.0.apk');
  const fallbackApk = path.join(__dirname, '..', 'Vyoma_ScanServe.apk');
  const targetApk = fs.existsSync(apkPath) ? apkPath : fallbackApk;

  if (!fs.existsSync(targetApk)) {
    console.error(`\n❌ APK file not found at ${targetApk}. Please run 'npm run apk:build' first.\n`);
    process.exit(1);
  }

  console.log(`\n📦 Installing APK: ${targetApk}...`);
  // Install with -r (reinstall) and -d (allow version downgrade if needed)
  execSync(`"${adbPath}" install -r -d "${targetApk}"`, { stdio: 'inherit' });

  console.log('\n🚀 Launching Vyoma ScanServe on device...');
  try {
    execSync(`"${adbPath}" shell am start -n com.vyoma.scanserve/com.vyoma.scanserve.MainActivity`, { stdio: 'inherit' });
    console.log('\n✨ Done! Vyoma ScanServe Dashboard is now running on your device.\n');
  } catch (launchErr) {
    console.log('\n✅ APK installed successfully! You can tap the "Vyoma ScanServe" icon on your device.\n');
  }

} catch (err) {
  console.error('\n❌ ADB execution error:', err.message);
  process.exit(1);
}
