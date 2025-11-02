#!/usr/bin/env node

/**
 * System Verification Script
 * 系统功能验证脚本
 * 
 * This script verifies that the chat application system is functioning properly.
 * 此脚本验证聊天应用系统是否正常工作。
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TIMEOUT = 30000; // 30 seconds timeout
const API_PORT = 3003;
const API_URL = `http://localhost:${API_PORT}`;

let apiProcess = null;

function log(message) {
  console.log(`[Verify] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
}

function checkHealth() {
  return new Promise((resolve, reject) => {
    http.get(`${API_URL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ok === true);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const isHealthy = await checkHealth();
      if (isHealthy) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
  }
  return false;
}

function startApiServer() {
  return new Promise((resolve, reject) => {
    log('Starting API server...');
    
    apiProcess = spawn('npm', ['run', 'dev', '-w', 'apps/api'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    
    apiProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('listening on')) {
        resolve();
      }
    });

    apiProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    apiProcess.on('error', (err) => {
      reject(err);
    });

    apiProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`API server exited with code ${code}`));
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!output.includes('listening on')) {
        resolve(); // Continue anyway, will check health endpoint
      }
    }, 5000);
  });
}

function stopApiServer() {
  if (apiProcess) {
    log('Stopping API server...');
    apiProcess.kill();
    apiProcess = null;
  }
}

async function verifyBuild() {
  log('Verifying build output...');
  
  const apiDist = path.join(process.cwd(), 'apps/api/dist/index.js');
  const webDist = path.join(process.cwd(), 'apps/web/dist/index.html');
  const sharedDist = path.join(process.cwd(), 'packages/shared/dist/types.js');
  
  const checks = [
    { path: apiDist, name: 'API build' },
    { path: webDist, name: 'Web build' },
    { path: sharedDist, name: 'Shared build' }
  ];
  
  let allGood = true;
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      log(`✓ ${check.name} exists`);
    } else {
      error(`✗ ${check.name} missing: ${check.path}`);
      allGood = false;
    }
  }
  
  return allGood;
}

async function runVerification() {
  log('========================================');
  log('Chat Application System Verification');
  log('聊天应用系统功能验证');
  log('========================================\n');

  try {
    // Step 1: Verify builds exist
    log('Step 1: Checking build outputs...');
    const buildOk = await verifyBuild();
    if (!buildOk) {
      error('Build verification failed!');
      return false;
    }
    log('✓ All builds present\n');

    // Step 2: Start API server
    log('Step 2: Starting API server...');
    await startApiServer();
    log('✓ API server started\n');

    // Step 3: Wait for server to be ready
    log('Step 3: Waiting for server to be ready...');
    const serverReady = await waitForServer();
    if (!serverReady) {
      error('Server failed to become ready!');
      return false;
    }
    log('✓ Server is ready\n');

    // Step 4: Test health endpoint
    log('Step 4: Testing health endpoint...');
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      error('Health check failed!');
      return false;
    }
    log('✓ Health check passed\n');

    log('========================================');
    log('✓ All verifications passed!');
    log('✓ 所有验证通过！');
    log('✓ System is working normally!');
    log('✓ 系统正常工作！');
    log('========================================');
    
    return true;

  } catch (err) {
    error(`Verification failed: ${err.message}`);
    return false;
  } finally {
    stopApiServer();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  stopApiServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopApiServer();
  process.exit(0);
});

// Run verification
runVerification().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((err) => {
  error(`Unexpected error: ${err.message}`);
  stopApiServer();
  process.exit(1);
});
