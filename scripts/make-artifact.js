#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'out');
const appName = 'apolocast';

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function ensureOutDir() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
}

function copyArtifacts(fromDir, extension) {
  ensureOutDir();

  if (!fs.existsSync(fromDir)) {
    console.error(`Directory not found: ${fromDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(fromDir)
    .filter((name) => name.toLowerCase().endsWith(extension));

  if (files.length === 0) {
    console.error(`No ${extension} files found in: ${fromDir}`);
    process.exit(1);
  }

  for (const file of files) {
    const src = path.join(fromDir, file);
    const dst = path.join(outDir, file);
    fs.copyFileSync(src, dst);
    console.log(`Copied ${file} -> out/`);
  }
}

function copyWinExeFromPackageDir(packageDir) {
  const exeName = `${appName}.exe`;
  const exePath = path.join(packageDir, exeName);

  if (!fs.existsSync(exePath)) {
    console.error(`Windows executable not found: ${exePath}`);
    process.exit(1);
  }

  ensureOutDir();
  const outExePath = path.join(outDir, exeName);
  fs.copyFileSync(exePath, outExePath);
  console.log(`Copied ${exeName} -> out/`);
}

function packageWin() {
  run('electron-forge', ['package', '--platform=win32', '--arch=x64'], {
    NODE_OPTIONS: '--no-deprecation',
  });

  const packageDirName = `${appName}-win32-x64`;
  const packageDir = path.join(outDir, packageDirName);

  if (!fs.existsSync(packageDir)) {
    console.error(`Packaged app folder not found: ${packageDir}`);
    process.exit(1);
  }

  return { packageDirName, packageDir };
}

function makeWinExe() {
  const { packageDir } = packageWin();
  copyWinExeFromPackageDir(packageDir);
}

function makeLinuxDeb() {
  run('electron-forge', [
    'make',
    '--platform=linux',
    '--arch=x64',
    '--targets=@electron-forge/maker-deb',
  ]);

  copyArtifacts(path.join(outDir, 'make', 'deb', 'x64'), '.deb');
}

function makeWinTarGz() {
  const { packageDirName } = packageWin();
  const archivePath = path.join(outDir, `${packageDirName}.tar.gz`);

  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }

  run('tar', ['-czf', archivePath, '-C', outDir, packageDirName]);
  console.log(`Generated ${path.basename(archivePath)} in out/`);
}

function makeMac() {
  run('electron-forge', ['make', '--platform=darwin', '--arch=x64']);
}

function usage() {
  console.log('Usage:');
  console.log('  yarn make win       # gera .exe em out/');
  console.log('  yarn make win zip   # gera .tar.gz em out/');
  console.log('  yarn make linux     # gera .deb em out/');
  console.log('  yarn make mac       # make para darwin (Mac)');
}

const [target, variant] = process.argv.slice(2);

if (target === '-h' || target === '--help' || target === 'help') {
  usage();
  process.exit(0);
} else if (target === 'win' && !variant) {
  makeWinExe();
} else if (target === 'win' && variant === 'zip') {
  makeWinTarGz();
} else if (target === 'linux') {
  makeLinuxDeb();
} else if (target === 'mac') {
  makeMac();
} else {
  usage();
  process.exit(1);
}
