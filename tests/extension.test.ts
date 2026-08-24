import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {JsQrExtension} from '../src/extension.js';

function scratch(runtime: Record<string, unknown> = {}) {
  return {
    vm: {runtime},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {REPORTER: 'reporter'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
  };
}

beforeEach(() => {
  vi.stubGlobal('Scratch', scratch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('JsQrExtension', () => {
  it('registers a runtime capability and reports metadata', () => {
    const extension = new JsQrExtension();
    expect(Scratch.vm.runtime.ext_kubohiroyajsqr).toBe(extension);
    const info = extension.getInfo() as {name: string; blocks: Array<{text: string}>};
    expect(info.name).toBe('jsQR');
    expect(info.blocks.map((block) => block.text)).toContain('last QR text');
    expect(extension.lastQrTextReporter()).toBe('');
  });

  it('requires the shared camera source for waits', async () => {
    const extension = new JsQrExtension();
    await expect(extension.waitForQrText()).rejects.toThrow(/camera-source/u);
  });
});
