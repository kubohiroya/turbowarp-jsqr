import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {JsQrExtension} from '../src/extension.js';

function scratch(runtime: Record<string, unknown> = {}) {
  return {
    vm: {runtime},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter'},
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
    expect(extension.capabilityVersion).toBe(2);
  });

  it('requires the shared camera source for waits', async () => {
    const extension = new JsQrExtension();
    await expect(extension.waitForQrText()).rejects.toThrow(/camera-source/u);
  });

  it('passes the requested camera ID to Camera Source', async () => {
    const release = vi.fn(async () => undefined);
    const acquireCamera = vi.fn(async () => ({
      getFrameSource: () => ({element: {}, width: 1, height: 1}),
      release
    }));
    vi.stubGlobal('Scratch', scratch({ext_kubohiroyacamerasource: {acquireCamera}}));
    const extension = new JsQrExtension();
    vi.spyOn(extension, 'scanFrame').mockResolvedValue('qr:downward');

    await expect(extension.waitForQrText({cameraId: 'qr'})).resolves.toBe('qr:downward');

    expect(acquireCamera).toHaveBeenCalledWith({owner: 'kubohiroyajsqr', cameraId: 'qr'});
    expect(release).toHaveBeenCalledOnce();
  });
});
