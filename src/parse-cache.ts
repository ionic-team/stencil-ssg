import type { ParseMarkdownOptions, MarkdownResults, ParseCacheApi } from './types';
import { readFile, writeFile } from './parse-utils';
import crypto from 'crypto';
import os from 'os';
import path from 'path';

export function parseCache(content: string, opts: ParseMarkdownOptions): ParseCacheApi {
  const cryptoHash = crypto.createHash('md5');
  cryptoHash.update(content);
  cryptoHash.update('1'); // cache buster

  Object.keys(opts)
    .sort()
    .map((key) => {
      const value = (opts as any)[key];
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'function' ||
        value == null
      ) {
        return key + ':' + String(value);
      }
      return key + ':' + JSON.stringify(value);
    })
    .forEach((cacheOpt) => cryptoHash.update(cacheOpt));

  const cacheDir = typeof opts.cacheDir === 'string' ? opts.cacheDir : os.tmpdir();
  const hash = cryptoHash.digest('hex');
  const cacheFileName = `stencil-md-${hash}.json`;
  const cachePath = path.join(cacheDir, cacheFileName);

  const get = async () => {
    try {
      const cachedContent = await readFile(cachePath, 'utf8');
      const cachedResults: MarkdownResults = JSON.parse(cachedContent);
      return cachedResults;
    } catch (e) {}
    return null;
  };

  const put = async (results: MarkdownResults) => writeFile(cachePath, JSON.stringify(results));

  return { get, put };
}
