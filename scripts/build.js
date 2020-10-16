const path = require('path');
const fs = require('fs');
const rollup = require('rollup');
const rollupCommonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

const rootDir = path.join(__dirname, '..',);
const buildDir = path.join(rootDir, 'build');
const distDir = path.join(rootDir, 'dist');
const srcPrism = path.join(rootDir, 'src', 'prism.js');

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

  let prismCode = `(function() {\n${fs.readFileSync(srcPrism, 'utf8')}\n})();`;
  prismCode = prismCode.replace(`module.exports = Prism;`, ``);

  const rollupBuild = await rollup.rollup(inputOpts);

  await rollupBuild.write({
    format: 'cjs',
    file: path.join(distDir, 'parse.js'),
    preferConst: true,
    intro: prismCode
  });
}

build();
