import { slugify } from '../slugify';

it(`slugify`, () => {
  expect(slugify(`My Slugify`)).toBe(`my-slugify`);
  expect(slugify(`My Slugify`, { replacement: `_` })).toBe(`my_slugify`);
  expect(slugify(`My Slugify`, { lower: false })).toBe(`My-Slugify`);
  expect(slugify(`My Slugify!!`)).toBe(`my-slugify`);
  expect(slugify(`My Slugify!!`, { strict: false })).toBe(`my-slugify!!`);
  expect(slugify(`My Slugify.markdown`)).toBe(`my-slugify`);
  expect(slugify(`My Slugify.md`, { removeFileExtension: false })).toBe(
    `my-slugifymd`,
  );
  expect(slugify(`---My Slugify---`)).toBe(`my-slugify`);
  expect(slugify(`---My Slugify---`, { replacement: `_` })).toBe(`my_slugify`);
  expect(slugify(`---My Slugify---`, { trimReplacement: false })).toBe(
    `-my-slugify-`,
  );
  expect(slugify(`-`)).toBe(`-`);
  expect(slugify(`--`)).toBe(`-`);
  expect(slugify(`---`)).toBe(`-`);
  expect(slugify(`--#--This is  Some     Example of A_ Heading?!--`)).toBe(
    `this-is-some-example-of-a-heading`,
  );
});
