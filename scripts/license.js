const fs = require('fs');
const path = require('path');

const entryDeps = ['front-matter', 'marked', 'slugify'];

function createLicense() {
  const thirdPartyLicensesRootPath = path.join(__dirname, '..', 'NOTICE.md');

  const bundledDeps = [];

  createBundledDeps(bundledDeps, entryDeps);

  bundledDeps.sort((a, b) => {
    if (a.moduleId < b.moduleId) return -1;
    if (a.moduleId > b.moduleId) return 1;
    return 0;
  });

  const licenses = bundledDeps
    .map(l => l.license)
    .reduce((arr, l) => {
      if (!arr.includes(l)) {
        arr.push(l);
      }
      return arr;
    }, [])
    .sort();

  const output =
    `
# Licenses of Bundled Dependencies

The published distribution contains the following licenses:

${licenses.map(l => `    ` + l).join('\n')}

The following distributions have been modified to be bundled within this distribution:

--------

${bundledDeps.map(l => l.content).join('\n')}

`.trim() + '\n';

  fs.writeFileSync(thirdPartyLicensesRootPath, output);

  console.log(`NOTICE.md created 🐙\n`);
}

function createBundledDeps(bundledDeps, deps) {
  if (Array.isArray(deps)) {
    deps.forEach(moduleId => {
      if (includeDepLicense(bundledDeps, moduleId)) {
        const bundledDep = createBundledDepLicense(moduleId);
        bundledDeps.push(bundledDep);

        createBundledDeps(bundledDeps, bundledDep.dependencies);
      }
    });
  }
}

function createBundledDepLicense(moduleId) {
  const moduleDir = path.join(__dirname, '..', 'node_modules', moduleId);
  const pkgJsonFile = path.join(moduleDir, 'package.json');
  const pkgJson = require(pkgJsonFile);
  const output = [];
  let license = null;

  output.push(`## \`${moduleId}\``, ``);

  if (typeof pkgJson.license === 'string') {
    license = pkgJson.license;
    output.push(`License: ${pkgJson.license}`, ``);
  }

  if (Array.isArray(pkgJson.licenses)) {
    const bundledLicenses = [];
    pkgJson.licenses.forEach(l => {
      if (l.type) {
        license = l.type;
        bundledLicenses.push(l.type);
      }
    });

    if (bundledLicenses.length > 0) {
      output.push(`License: ${bundledLicenses.join(', ')}`, ``);
    }
  }

  const author = getContributors(pkgJson.author);
  if (typeof author === 'string') {
    output.push(`Author: ${author}`, ``);
  }

  const contributors = getContributors(pkgJson.contributors);
  if (typeof contributors === 'string') {
    output.push(`Contributors: ${contributors}`, ``);
  }

  if (typeof pkgJson.homepage === 'string') {
    output.push(`Homepage: ${pkgJson.homepage}`, ``);
  }

  const depLicense = getBundledDepLicenseContent(moduleDir);
  if (typeof depLicense === 'string') {
    depLicense
      .trim()
      .split('\n')
      .forEach(ln => {
        output.push(`> ${ln}`);
      });
  }

  output.push(``, `--------`, ``);

  const dependencies = (pkgJson.dependencies
    ? Object.keys(pkgJson.dependencies)
    : []
  ).sort();

  return {
    moduleId,
    content: output.join('\n'),
    license,
    dependencies,
  };
}

function getContributors(prop) {
  if (typeof prop === 'string') {
    return prop;
  }

  if (Array.isArray(prop)) {
    return prop
      .map(getAuthor)
      .filter(c => !!c)
      .join(', ');
  }

  if (prop) {
    return getAuthor(prop);
  }
}

function getAuthor(c) {
  if (typeof c === 'string') {
    return c;
  }
  if (typeof c.name === 'string') {
    if (typeof c.url === 'string') {
      return `[${c.name}](${c.url})`;
    } else {
      return c.name;
    }
  }
  if (typeof c.url === 'string') {
    return c.url;
  }
}

function getBundledDepLicenseContent(moduleDir) {
  const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE-MIT', 'LICENSE.txt'];
  for (const licenseFile of licenseFiles) {
    try {
      const licensePath = path.join(moduleDir, licenseFile);
      return fs.readFileSync(licensePath, 'utf8');
    } catch (e) {}
  }
}

function includeDepLicense(bundledDeps, moduleId) {
  if (moduleId.startsWith('@types/')) {
    return false;
  }
  if (bundledDeps.some(b => b.moduleId === moduleId)) {
    return false;
  }
  return true;
}

createLicense();
