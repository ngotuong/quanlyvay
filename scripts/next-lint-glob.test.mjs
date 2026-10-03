import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const requireWeb = createRequire(resolve("apps/web/package.json"));
const requireNext = createRequire(requireWeb.resolve("eslint-config-next"));
const pluginPath = requireNext.resolve("@next/eslint-plugin-next");
const plugin = requireNext("@next/eslint-plugin-next");
const { getRootDirs } = requireNext(join(dirname(pluginPath), "utils/get-root-dirs.js"));
const { Linter } = requireWeb("eslint");

function fixture(run) {
  const previous = process.cwd();
  mkdirSync(resolve(".cache"), { recursive: true });
  const root = mkdtempSync(resolve(".cache/c76-lint-glob-"));
  for (const directory of ["apps/alpha/pages", "apps/beta/pages", "apps/.hidden/pages"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(join(root, "apps/readme.txt"), "synthetic fixture");
  writeFileSync(join(root, "apps/alpha/pages/about.js"), "export default function About() {}\n");
  try {
    process.chdir(root);
    run(root);
  } finally {
    process.chdir(previous);
    rmSync(root, { recursive: true });
  }
}

test("Next lint defaults to the supplied cwd without a root glob", () => {
  fixture((root) => {
    assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
  });
});

test("Next root glob selects directories, excludes files and hidden directories", () => {
  fixture((root) => {
    const actual = getRootDirs({ cwd: root, settings: { next: { rootDir: "apps/*" } } });
    assert.deepEqual(actual.sort(), ["apps/alpha", "apps/beta"]);
  });
});

test("Next root globs retain arrays, braces, absolute paths and separator normalization", () => {
  fixture((root) => {
    const actual = getRootDirs({ cwd: root, settings: { next: { rootDir: ["apps\\{alpha,beta}", 7] } } });
    assert.deepEqual(actual.sort(), ["apps/alpha", "apps/beta"]);
    assert.deepEqual(getRootDirs({ cwd: root, settings: { next: { rootDir: join(root, "apps/alpha") } } }), [join(root, "apps/alpha")]);
  });
});

test("Next link rule still discovers pages through the replacement glob", () => {
  fixture((root) => {
    const config = {
      languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { "@next/next": plugin },
      settings: { next: { rootDir: "apps/*" } },
      rules: { "@next/next/no-html-link-for-pages": "error" },
    };
    const linter = new Linter({ cwd: root });
    const internal = linter.verify('const link = <a href="/about">About</a>;', config, "example.js");
    assert.equal(internal.length, 1);
    assert.equal(internal[0].ruleId, "@next/next/no-html-link-for-pages");
    assert.equal(linter.verify('const link = <a href="https://example.com">External</a>;', config, "example.js").length, 0);
  });
});
