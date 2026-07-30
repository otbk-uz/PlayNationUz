const fsStd = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const esbuild = require('esbuild');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const targetDir = path.join(projectRoot, 'dist-obfuscated');

// Helper to copy directory recursively
function copyDirSync(src, dest, exclude = []) {
  if (!fsStd.existsSync(dest)) {
    fsStd.mkdirSync(dest, { recursive: true });
  }
  const entries = fsStd.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (exclude.includes(entry.name) || exclude.some(ex => srcPath.includes(ex))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, exclude);
    } else {
      fsStd.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to get all files in a directory recursively
function getFiles(dir, filesList = []) {
  const files = fsStd.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fsStd.statSync(name).isDirectory()) {
      getFiles(name, filesList);
    } else {
      filesList.push(name);
    }
  }
  return filesList;
}

async function run() {
  console.log("Starting obfuscation process...");

  // 1. Clean and recreate target directory
  if (fsStd.existsSync(targetDir)) {
    console.log("Cleaning old dist-obfuscated folder...");
    try {
      fsStd.rmSync(targetDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (cleanErr) {
      console.warn("Could not remove dist-obfuscated root dir directly, cleaning subdirectories instead:", cleanErr.message);
      try {
        const entries = fsStd.readdirSync(targetDir);
        for (const entry of entries) {
          if (entry !== '.git') {
            fsStd.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
          }
        }
      } catch (subErr) {
        console.warn("Subdirectory clean warning:", subErr.message);
      }
    }
  }
  if (!fsStd.existsSync(targetDir)) {
    fsStd.mkdirSync(targetDir, { recursive: true });
  }

  // 2. Copy project files
  console.log("Copying files to dist-obfuscated...");
  const excludes = [
    'node_modules',
    '.next',
    '.git',
    'dist-obfuscated',
    'scripts', // do not copy the scripts folder itself
    '.env.local',
    'tsconfig.tsbuildinfo',
    'dist'
  ];
  copyDirSync(projectRoot, targetDir, excludes);

  // 3. Obfuscate JS/TS/TSX files
  console.log("Transpiling and Obfuscating source code...");
  const srcPath = path.join(targetDir, 'src');
  if (fsStd.existsSync(srcPath)) {
    const files = getFiles(srcPath);
    for (const filePath of files) {
      const ext = path.extname(filePath);
      if (['.js', '.ts', '.tsx'].includes(ext)) {
        let code = fsStd.readFileSync(filePath, 'utf8');
        let jsCode = code;

        // A. Transpile TS/TSX to JS first using esbuild
        if (ext === '.ts' || ext === '.tsx') {
          try {
            const loader = ext === '.tsx' ? 'tsx' : 'ts';
            const transpileResult = esbuild.transformSync(code, {
              loader: loader,
              jsx: 'automatic',
              target: 'es6',
              format: 'esm'
            });
            jsCode = transpileResult.code;
          } catch (transpileErr) {
            console.error(`Failed to transpile ${path.relative(targetDir, filePath)}:`, transpileErr.message);
            continue;
          }
        }

        // B. Obfuscate the transpiled JavaScript
        console.log(`Obfuscating: ${path.relative(targetDir, filePath)}`);
        try {
          const obfuscatedResult = JavaScriptObfuscator.obfuscate(jsCode, {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: false,
            renameGlobals: false,
            selfDefending: false,
            simplify: true,
            splitStrings: false,
            stringArray: true,
            stringArrayCallsTransform: false,
            stringArrayEncoding: [],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 1,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 2,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
          });

          // Write back as .js (even if it was .tsx or .ts) to prevent TypeScript check issues on build
          const dir = path.dirname(filePath);
          const baseName = path.basename(filePath, ext);
          const newFilePath = path.join(dir, `${baseName}.js`);

          fsStd.writeFileSync(newFilePath, obfuscatedResult.getObfuscatedCode(), 'utf8');

          // If we renamed the file, delete the original .ts/.tsx file
          if (newFilePath !== filePath) {
            fsStd.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Failed to obfuscate ${filePath}:`, err.message);
        }
      }
    }
  }

  // Also obfuscate main.js and preload.js in root of targetDir
  const mainFiles = ['main.js', 'preload.js'];
  for (const file of mainFiles) {
    const filePath = path.join(targetDir, file);
    if (fsStd.existsSync(filePath)) {
      console.log(`Obfuscating root file: ${file}`);
      const code = fsStd.readFileSync(filePath, 'utf8');
      try {
        const obfuscatedResult = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          stringArray: true,
          stringArrayThreshold: 0.75
        });
        fsStd.writeFileSync(filePath, obfuscatedResult.getObfuscatedCode(), 'utf8');
      } catch (err) {
        console.error(`Failed to obfuscate ${file}:`, err.message);
      }
    }
  }

  console.log("Obfuscation complete!");
  
  // 4. Initialize Git in the target directory and push
  try {
    console.log("Preparing git commit in dist-obfuscated...");
    execSync('git init', { cwd: targetDir, stdio: 'inherit' });
    execSync('git config user.name "Maroqli CI"', { cwd: targetDir, stdio: 'inherit' });
    execSync('git config user.email "ci@maroqli.uz"', { cwd: targetDir, stdio: 'inherit' });
    execSync('git remote add origin https://github.com/otbk-uz/maroqli-uz.git', { cwd: targetDir, stdio: 'inherit' });
    execSync('git checkout -b main', { cwd: targetDir, stdio: 'inherit' });
    execSync('git add .', { cwd: targetDir, stdio: 'inherit' });
    execSync('git commit -m "build: publish obfuscated public release"', { cwd: targetDir, stdio: 'inherit' });
    
    console.log("Pushing obfuscated code to GitHub main branch...");
    // Force push to main branch of public repo
    execSync('git push origin main --force', { cwd: targetDir, stdio: 'inherit' });
    console.log("Successfully pushed obfuscated code to GitHub!");
  } catch (gitErr) {
    console.error("Git operations failed:", gitErr.message);
  }
}

run();
