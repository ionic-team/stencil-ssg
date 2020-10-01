import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { slugify } from './slugify';

export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);

export const slugifyFilePath = (filePath: string) => {
  let basename = path.basename(filePath);
  if (basename.toLowerCase() === 'index.md') {
    basename = path.basename(path.dirname(filePath));
  }
  return slugify(basename!);
};
