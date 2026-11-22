import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ZxingExtension} from '../src/extension.js';

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

describe('ZxingExtension', () => {
  it('registers a runtime capability and reports metadata', () => {
    const extension = new ZxingExtension();
    expect(Scratch.vm.runtime.ext_kubohiroyazxing).toBe(extension);
    const info = extension.getInfo() as {name: string; blocks: Array<{text: string}>};
    expect(info.name).toBe('ZXing');
    expect(info.blocks.map((block) => block.text)).toContain('last QR text');
    expect(extension.lastQrTextReporter()).toBe('');
    expect(extension.capabilityVersion).toBe(2);
  });

  it('requires the shared camera source for waits', async () => {
    const extension = new ZxingExtension();
    await expect(extension.waitForQrText()).rejects.toThrow(/camera-source/u);
  });

  it('passes the requested camera ID to Camera Source', async () => {
    const release = vi.fn(async () => undefined);
    const acquireCamera = vi.fn(async () => ({
      getFrameSource: () => ({
        kind: 'video',
        element: {},
        width: 1,
        height: 1,
        previewFlip: 'none',
        deviceId: 'camera-0'
      }),
      release
    }));
    vi.stubGlobal('Scratch', scratch({ext_kubohiroyacamerasource: {acquireCamera}}));
    const extension = new ZxingExtension();
    vi.spyOn(extension, 'scanFrame').mockResolvedValue('qr:downward');

    await expect(extension.waitForQrText({cameraId: 'qr'})).resolves.toBe('qr:downward');

    expect(acquireCamera).toHaveBeenCalledWith({owner: 'kubohiroyazxing', cameraId: 'qr'});
    expect(release).toHaveBeenCalledOnce();
  });
});
