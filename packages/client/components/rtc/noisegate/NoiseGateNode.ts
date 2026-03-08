import NoiseGateWorkletProcessorUrl from "./NoiseGateWorkletProcessor?url";
import { type NoiseGateWorkletOptions, id } from "./util";

export type NoiseGateProcessorOptions = {
  /**
   * threshold to open the gate in dB
   */
  openThreshold: number;
  /**
   * threshold to close the gate in dB
   *
   * @default openThreshold
   */
  closeThreshold?: number;
  /**
   * length of time to close the gate in milliseconds
   *
   * When the input sound is under the closeThreshold for this time, the gate will close.
   */
  holdMs: number;
  /**
   * the maximum number of channels
   */
  maxChannels: number;
  /**
   * the configured sample rate of the AudioContext
   */
  sampleRate?: number;
};

export class NoiseGateNode extends AudioWorkletNode {
  static async addModule(context: AudioContext) {
    await context.audioWorklet.addModule(NoiseGateWorkletProcessorUrl);
  }

  constructor(
    context: AudioContext,
    {
      openThreshold,
      closeThreshold = openThreshold,
      holdMs,
      maxChannels,
    }: Readonly<NoiseGateProcessorOptions>,
  ) {
    const workletOptions: NoiseGateWorkletOptions = {
      processorOptions: {
        openThreshold,
        closeThreshold,
        holdMs,
        maxChannels,
        sampleRate: context.sampleRate,
      },
    };

    super(context, id, workletOptions);
  }
}
