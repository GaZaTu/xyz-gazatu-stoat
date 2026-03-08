import type {
  AudioProcessorOptions,
  ProcessorOptions,
  Room,
  Track,
  TrackProcessor,
} from "livekit-client";
import { NoiseGateNode } from "./noisegate/NoiseGateNode";

function generateNoiseFloorCurve(floor: number) {
  // "floor" is 0...1

  const curve = new Float32Array(65536);
  const mappedFloor = floor * 32768;

  for (let i = 0; i < 32768; i++) {
    const value = i < mappedFloor ? 0 : 1;

    curve[32768 - i] = -value;
    curve[32768 + i] = value;
  }
  curve[0] = curve[1]; // fixing up the end.

  return curve;
}

function createNoiseGate(audioContext: AudioContext, floor: number) {
  const inputNode = audioContext.createGain();
  const rectifier = audioContext.createWaveShaper();
  const ngFollower = audioContext.createBiquadFilter();
  const wetGain = audioContext.createGain();
  ngFollower.type = "lowpass";
  ngFollower.frequency.value = 10.0;

  const curve = new Float32Array(65536);
  for (let i = -32768; i < 32768; i++)
    curve[i + 32768] = (i > 0 ? i : -i) / 32768;
  rectifier.curve = curve;
  rectifier.connect(ngFollower);

  const ngGate = audioContext.createWaveShaper();
  ngGate.curve = generateNoiseFloorCurve(floor);

  ngFollower.connect(ngGate);

  const gateGain = audioContext.createGain();
  gateGain.gain.value = 0.0;
  ngGate.connect(gateGain.gain);

  gateGain.connect(wetGain);

  inputNode.connect(rectifier);
  inputNode.connect(gateGain);
  return {
    inputNode,
    wetGain,
  };
}

export interface NoiseGateTrackProcessorOptions {
  gain: number;
  threshold: number;
}

export class NoiseGateTrackProcessor implements TrackProcessor<
  Track.Kind.Audio,
  AudioProcessorOptions
> {
  name = NoiseGateTrackProcessor.name;

  processedTrack?: MediaStreamTrack;

  /**
   * Whether the current environment supports GainAudioProcessor (Web Audio API).
   * Use this for consistency with video processors before attaching the processor.
   */
  static get isSupported(): boolean {
    return (
      typeof AudioContext !== "undefined" &&
      typeof GainNode !== "undefined" &&
      typeof MediaStreamAudioSourceNode !== "undefined" &&
      typeof MediaStreamAudioDestinationNode !== "undefined"
    );
  }

  private sourceNode?: MediaStreamAudioSourceNode;

  private gainNode?: GainNode;

  private filterNode?: NoiseGateNode;

  private destinationNode?: MediaStreamAudioDestinationNode;

  constructor(private options: NoiseGateTrackProcessorOptions) {}

  async init(opts: ProcessorOptions<Track.Kind>): Promise<void> {
    const { track, audioContext } = opts;
    if (!audioContext) {
      console.error("FDM");
      return;
    }

    // Create source from the raw microphone track
    this.sourceNode = audioContext.createMediaStreamSource(
      new MediaStream([track]),
    );

    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = this.options.gain;

    await NoiseGateNode.addModule(audioContext);
    this.filterNode = new NoiseGateNode(audioContext, {
      maxChannels: 2,
      holdMs: 20,
      openThreshold: this.options.threshold,
      closeThreshold: this.options.threshold,
    });

    // Create destination
    this.destinationNode = audioContext.createMediaStreamDestination();

    // Wire up: source → gain → destination
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.filterNode);
    this.filterNode.connect(this.destinationNode);

    // Expose the processed track for the SDK
    this.processedTrack = this.destinationNode.stream.getAudioTracks()[0];
  }

  async restart(opts: ProcessorOptions<Track.Kind>): Promise<void> {
    // Tear down old graph and rebuild with the new track
    await this.destroy();
    await this.init(opts);
  }

  async destroy(): Promise<void> {
    this.sourceNode?.disconnect();
    this.filterNode?.disconnect();
    this.destinationNode?.disconnect();
    this.processedTrack?.stop();
    this.sourceNode = undefined;
    this.filterNode = undefined;
    this.destinationNode = undefined;
    this.processedTrack = undefined;
  }

  // Optional lifecycle hooks — included for completeness as a reference implementation
  async onPublish(room: Room): Promise<void> {
    console.debug(`[${this.name}] onPublish — room: ${room.name}`);
  }

  async onUnpublish(): Promise<void> {
    console.debug(`[${this.name}] onUnpublish`);
  }
}
