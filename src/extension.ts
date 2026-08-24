import jsQR from 'jsqr';
import {extensionConfig} from './config';
import definitions from './block-definitions.json';

type BlockTypeName = 'COMMAND' | 'REPORTER';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

interface CameraFrameSource {
  readonly element: HTMLVideoElement | HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
}

interface CameraLease {
  getFrameSource(): CameraFrameSource;
  release(): Promise<void>;
}

interface CameraSourceCapability {
  acquireCamera(options?: Record<string, unknown>): Promise<CameraLease>;
}

export interface WaitForQrTextOptions {
  signal?: AbortSignal;
  intervalMilliseconds?: number;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function abortError(): Error {
  const error = new Error('QR scanning was aborted.');
  error.name = 'AbortError';
  return error;
}

export class JsQrExtension implements TurboWarpExtension {
  private lastQrText = '';

  public constructor() {
    Scratch.vm.runtime.ext_kubohiroyajsqr = this;
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
    };
  }

  public lastQrTextReporter(): string {
    return this.lastQrText;
  }

  public async waitForQrTextSetRuntimeVar(args: {RUNTIME_VAR: unknown}): Promise<void> {
    const text = await this.waitForQrText();
    this.writeRuntimeVariable(args.RUNTIME_VAR, text);
  }

  public async waitForQrTextSetRuntimeVarAndBroadcast(
    args: {RUNTIME_VAR: unknown; MESSAGE: unknown}
  ): Promise<void> {
    const text = await this.waitForQrText();
    this.writeRuntimeVariable(args.RUNTIME_VAR, text);
    const message = String(args.MESSAGE ?? '').trim();
    if (!message) throw new Error('MESSAGE must be specified.');
    this.runtime().startHats?.('event_whenbroadcastreceived', {BROADCAST_OPTION: message});
  }

  public async waitForQrText(options: WaitForQrTextOptions = {}): Promise<string> {
    const signal = options.signal;
    if (signal?.aborted) throw abortError();
    const cameraSource = this.cameraSource();
    const lease = await cameraSource.acquireCamera({owner: extensionConfig.id});
    const intervalMilliseconds = Math.max(50, options.intervalMilliseconds ?? 150);
    try {
      return await new Promise<string>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const cleanup = () => {
          if (timer !== undefined) clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
        };
        const onAbort = () => {
          cleanup();
          reject(abortError());
        };
        const tick = () => {
          if (signal?.aborted) {
            onAbort();
            return;
          }
          try {
            const text = this.scanFrame(lease.getFrameSource());
            if (text !== null) {
              this.lastQrText = text;
              cleanup();
              resolve(text);
              return;
            }
          } catch (error) {
            cleanup();
            reject(error);
            return;
          }
          timer = setTimeout(tick, intervalMilliseconds);
        };
        signal?.addEventListener('abort', onAbort, {once: true});
        tick();
      });
    } finally {
      await lease.release();
    }
  }

  public scanFrame(frame: CameraFrameSource): string | null {
    const width = Math.max(0, Math.floor(frame.width));
    const height = Math.max(0, Math.floor(frame.height));
    if (width === 0 || height === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) throw new Error('2D canvas context is unavailable.');
    context.drawImage(frame.element, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const result = jsQR(image.data, width, height);
    return result?.data ?? null;
  }

  private cameraSource(): CameraSourceCapability {
    const candidate = this.runtime().ext_kubohiroyacamerasource;
    if (!isRecord(candidate) || typeof candidate.acquireCamera !== 'function') {
      throw new Error('jsQR requires @kubohiroya/turbowarp-camera-source.');
    }
    return candidate as unknown as CameraSourceCapability;
  }

  private runtime(): Record<string, unknown> & {
    ext_lmsTempVars2?: {
      setRuntimeVariable(args: {VAR: string; STRING: string}): void;
    };
    startHats?: (hat: string, args: Record<string, unknown>) => void;
  } {
    return Scratch.vm.runtime;
  }

  private writeRuntimeVariable(name: unknown, value: string): void {
    const runtimeVariable = String(name ?? '').trim();
    if (!runtimeVariable) throw new Error('RUNTIME_VAR must be specified.');
    const temporaryVariables = this.runtime().ext_lmsTempVars2;
    if (!temporaryVariables || typeof temporaryVariables.setRuntimeVariable !== 'function') {
      throw new Error('Temporary Variables (lmsTempVars2) must be loaded before using jsQR blocks.');
    }
    temporaryVariables.setRuntimeVariable({VAR: runtimeVariable, STRING: value});
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: Scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue
          }
        ])
      )
    };
  }
}
