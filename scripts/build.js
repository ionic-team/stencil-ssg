const path = require('path');
const fs = require('fs');
const rollup = require('rollup');
const rollupCommonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

const buildDir = path.join(__dirname, '..', 'build');
const distDir = path.join(__dirname, '..', 'dist');

async function build() {
  await bundleIndexEsm();
  await bundleParseCjs();

  console.log(`Build success 🏎💨\n`);
}

async function bundleIndexEsm() {
  const inputOpts = {
    input: path.join(buildDir, 'index.js'),
    external: ['@stencil/core'],
    plugins: [nodeResolve()],
  };

  const rollupBuild = await rollup.rollup(inputOpts);

  await rollupBuild.write({
    format: 'esm',
    file: path.join(distDir, 'index.js'),
    preferConst: true,
  });
}

async function bundleParseCjs() {
  const inputOpts = {
    input: path.join(buildDir, 'parse.js'),
    external: [
      '@stencil/core/mock-doc',
      'crypto',
      'path',
      'prismjs',
      'fs',
      'os',
      'util',
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      rollupCommonjs(),
    ],
  };

  const rollupBuild = await rollup.rollup(inputOpts);

  await rollupBuild.write({
    format: 'cjs',
    file: path.join(distDir, 'parse.js'),
    preferConst: true,
  });
}

build();
