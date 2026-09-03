import { describe, expect, it } from 'bun:test';
import {
  buildPermalink,
  formatPointerLabel,
  parsePointer,
  parseRepoSlug,
  resolveSymbolLine,
} from './permalink';

const SLUG = { owner: 'minjun0219', repo: 'rocky' };
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

describe('parseRepoSlug', () => {
  it('SSH remote 를 받는다', () => {
    expect(parseRepoSlug('git@github.com:minjun0219/rocky.git')).toEqual(SLUG);
  });

  it('HTTPS remote 를 받는다 (.git 유무 무관)', () => {
    expect(parseRepoSlug('https://github.com/minjun0219/rocky.git')).toEqual(SLUG);
    expect(parseRepoSlug('https://github.com/minjun0219/rocky')).toEqual(SLUG);
  });

  it('GitHub 이 아니면 조용히 틀린 URL 을 만들지 않고 실패한다', () => {
    expect(() => parseRepoSlug('git@gitlab.com:minjun0219/rocky.git')).toThrow(
      /GitHub remote 가 아니다/,
    );
  });
});

describe('parsePointer', () => {
  it('경로만 주면 파일 전체를 가리킨다', () => {
    expect(parsePointer('src/index.ts')).toEqual({ path: 'src/index.ts' });
  });

  it('단일 줄과 범위를 구분한다', () => {
    expect(parsePointer('src/index.ts:42')).toEqual({
      path: 'src/index.ts',
      line: { start: 42, end: 42 },
    });
    expect(parsePointer('src/index.ts:42-58')).toEqual({
      path: 'src/index.ts',
      line: { start: 42, end: 58 },
    });
  });

  it('숫자가 아니면 심볼로 본다', () => {
    expect(parsePointer('src/core/handlers.ts:handleOpenapiSearch')).toEqual({
      path: 'src/core/handlers.ts',
      symbol: 'handleOpenapiSearch',
    });
  });

  it('뒤집힌 범위는 실패한다', () => {
    expect(() => parsePointer('src/index.ts:58-42')).toThrow(/줄 범위가 잘못됐다/);
  });
});

describe('resolveSymbolLine', () => {
  const source = [
    'import { x } from "./x";',
    '',
    'const helper = 1;',
    '',
    'export function target(): number {',
    '  return helper;',
    '}',
  ].join('\n');

  it('정의 줄의 번호를 돌려준다', () => {
    expect(resolveSymbolLine(source, 'target')).toBe(5);
  });

  // 호출부가 여럿이어도 정의가 하나면 그것으로 정해진다.
  it('정의처럼 보이는 줄을 호출부보다 우선한다', () => {
    expect(resolveSymbolLine(source, 'helper')).toBe(3);
  });

  it('못 찾으면 실패한다', () => {
    expect(() => resolveSymbolLine(source, 'missing', 'src/a.ts')).toThrow(/심볼을 찾지 못했다/);
  });

  it('후보가 여럿이면 임의로 고르지 않고 후보를 보여준다', () => {
    const ambiguous = ['const a = 1;', 'const a2 = a;', 'let a3 = a;'].join('\n');
    expect(() => resolveSymbolLine(ambiguous, 'a', 'src/a.ts')).toThrow(/후보가 3건이라/);
  });
});

describe('buildPermalink', () => {
  it('단일 줄은 #L 하나만 붙인다', () => {
    expect(
      buildPermalink({ slug: SLUG, sha: SHA, path: 'src/index.ts', line: { start: 42, end: 42 } }),
    ).toBe(`https://github.com/minjun0219/rocky/blob/${SHA}/src/index.ts#L42`);
  });

  it('범위는 #L시작-L끝 로 붙인다', () => {
    expect(
      buildPermalink({ slug: SLUG, sha: SHA, path: 'src/index.ts', line: { start: 42, end: 58 } }),
    ).toBe(`https://github.com/minjun0219/rocky/blob/${SHA}/src/index.ts#L42-L58`);
  });

  it('줄이 없으면 파일 링크만 만든다', () => {
    expect(buildPermalink({ slug: SLUG, sha: SHA, path: 'README.md' })).toBe(
      `https://github.com/minjun0219/rocky/blob/${SHA}/README.md`,
    );
  });

  // 경로 구분자는 살리고 나머지만 인코딩한다 — 공백이 든 경로가 깨지지 않아야 한다.
  it('경로 구분자를 살린 채 인코딩한다', () => {
    expect(buildPermalink({ slug: SLUG, sha: SHA, path: 'docs/design/a b.md' })).toBe(
      `https://github.com/minjun0219/rocky/blob/${SHA}/docs/design/a%20b.md`,
    );
  });
});

describe('formatPointerLabel', () => {
  it('단일 줄은 경로:줄', () => {
    expect(formatPointerLabel('src/index.ts', { start: 42, end: 42 })).toBe('src/index.ts:42');
  });

  it('범위는 경로:시작-끝', () => {
    expect(formatPointerLabel('src/index.ts', { start: 42, end: 58 })).toBe('src/index.ts:42-58');
  });

  it('줄이 없으면 경로만', () => {
    expect(formatPointerLabel('README.md')).toBe('README.md');
  });
});
