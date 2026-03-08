import type { NoiseGateProcessorOptions } from "./NoiseGateNode";

export const id = "@sapphi-red/web-noise-suppressor/noise-gate";

export type TypedAudioWorkletOptions<T> = Omit<
  AudioWorkletNodeOptions,
  "processorOptions"
> & {
  processorOptions: T;
};

export type NoiseGateWorkletOptions = TypedAudioWorkletOptions<
  Required<NoiseGateProcessorOptions>
>;
