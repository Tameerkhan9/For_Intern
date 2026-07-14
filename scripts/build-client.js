const { execSync } = require('child_process');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'client');

execSync('npx react-scripts build', {
  cwd: clientDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    CI: 'false',
    DISABLE_ESLINT_PLUGIN: 'true',
    GENERATE_SOURCEMAP: 'false'
  }
});
