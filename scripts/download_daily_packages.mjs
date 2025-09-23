#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, dirname as pathDirname } from 'node:path';
import os from 'node:os';

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function getDayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getLastCommitForDay(date) {
  const { start, end } = getDayBounds(date);
  const since = start.toISOString();
  const until = end.toISOString();
  const cmd = `git --no-pager log --since='${since}' --until='${until}' --pretty=format:%H --max-count=1`;
  try {
    const out = sh(cmd);
    return out || null;
  } catch (e) {
    return null;
  }
}

function listPackageFilesAtCommit(commit) {
  const cmd = `git ls-tree -r --name-only ${commit}`;
  const files = sh(cmd)
    .split('\n')
    .filter(Boolean)
    .filter((f) => {
      return (
        f.endsWith('package.json') ||
        f.endsWith('package-lock.json') ||
        f.endsWith('pnpm-lock.yaml') ||
        f.endsWith('yarn.lock') ||
        f.endsWith('npm-shrinkwrap.json')
      );
    });
  return files;
}

function readFileAtCommit(commit, filePath) {
  const cmd = `git show ${commit}:${filePath}`;
  return sh(cmd);
}

function saveSnapshot(baseDir, dateStr, commit, files) {
  for (const filePath of files) {
    const contents = readFileAtCommit(commit, filePath);
    const target = join(baseDir, dateStr, filePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents, 'utf8');
  }
  // Write a small metadata file with the commit hash used
  const metaPath = join(baseDir, dateStr, '_commit.txt');
  mkdirSync(dirname(metaPath), { recursive: true });
  writeFileSync(metaPath, `${commit}\n`, 'utf8');
}

function pathDir(filePath) {
  return filePath.includes('/') ? pathDirname(filePath) : '.';
}

function installAndArchive(baseDir, dateStr, commit, pkgFilePaths) {
  const tmpRoot = mkdtempSync(join(os.tmpdir(), 'pkg-snapshot-'));
  for (const pkgPath of pkgFilePaths) {
    const dirRel = pathDir(pkgPath);
    const workDir = join(tmpRoot, dirRel);
    mkdirSync(workDir, { recursive: true });
    const filesToTry = [
      'package.json',
      'package-lock.json',
      'npm-shrinkwrap.json',
      'pnpm-lock.yaml',
      'yarn.lock'
    ];
    for (const f of filesToTry) {
      const candidate = dirRel === '.' ? f : `${dirRel}/${f}`;
      try {
        const content = readFileAtCommit(commit, candidate);
        writeFileSync(join(workDir, f), content, 'utf8');
      } catch {}
    }
    let installCmd = null;
    const hasPkg = existsSync(join(workDir, 'package.json'));
    const hasNpmLock = existsSync(join(workDir, 'package-lock.json')) || existsSync(join(workDir, 'npm-shrinkwrap.json'));
    if (hasPkg) {
      if (hasNpmLock) installCmd = 'npm ci --ignore-scripts';
      else installCmd = 'npm install --ignore-scripts --no-audit --no-fund';
    }
    if (installCmd) {
      try {
        sh(installCmd, { cwd: workDir });
        const outDir = join(baseDir, dateStr, dirRel);
        mkdirSync(outDir, { recursive: true });
        const archivePath = join(outDir, 'node_modules.tgz');
        sh(`tar -czf ${archivePath} node_modules`, { cwd: workDir });
      } catch (e) {
        // best-effort; continue to next package directory
      }
    }
  }
}

function main() {
  // Ensure we are in a git repo
  try { sh('git rev-parse --is-inside-work-tree'); } catch {
    console.error('Not a git repository. Run inside your repo root.');
    process.exit(1);
  }

  const baseDir = join(process.cwd(), 'artifacts', 'daily-packages');
  const install = process.argv.includes('--install');

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = iso(d);

    const commit = getLastCommitForDay(d);
    if (!commit) {
      continue;
    }

    const files = listPackageFilesAtCommit(commit);
    if (files.length === 0) continue;

    saveSnapshot(baseDir, dateStr, commit, files);
    if (install) {
      const pkgRoots = files.filter((f) => f.endsWith('package.json'));
      if (pkgRoots.length) installAndArchive(baseDir, dateStr, commit, pkgRoots);
    }
  }

  console.log('Saved package manifests for the last 7 days to artifacts/daily-packages');
  if (install) console.log('Archived node_modules per snapshot where possible.');
}

main();
