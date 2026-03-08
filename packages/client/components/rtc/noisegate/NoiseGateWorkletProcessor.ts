import { type Process, createProcessor } from "./createProcessor";
import { type NoiseGateWorkletOptions, id } from "./util";

const AudioWorkletBufferSize = 128;

declare class AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: unknown,
  ): boolean;
}

declare function registerProcessor(
  name: string,
  cls: new (...args: never[]) => unknown,
): void;

class NoiseGateWorkletProcessor extends AudioWorkletProcessor {
  processor: { process: Process };

  constructor(options: NoiseGateWorkletOptions) {
    super();

    const bufferMs =
      (1000 / options.processorOptions.sampleRate!) * AudioWorkletBufferSize;

    this.processor = createProcessor(options.processorOptions, bufferMs);
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: unknown,
  ) {
    if (inputs.length === 0 || !inputs[0] || inputs[0]?.length === 0) {
      // no input connected
      return true;
    }

    this.processor.process(inputs[0]!, outputs[0]!);
    return true;
  }
}

registerProcessor(id, NoiseGateWorkletProcessor);
