import { useState, useEffect, useRef } from 'react'
import { useAudioStore } from '../../store/audioSlice'
import { useDevicesStore } from '../../store/devicesSlice'
import { Slider } from '../shared/Slider'
import { StatusBadge } from '../shared/StatusBadge'
import { VUMeter } from './VUMeter'
import type { AudioDevice, PipelineConfig, PipelineStatus } from '../../../../shared/types'

export function KaraokePanel() {
  const {
    devices: audioDevices,
    selectedDeviceIndex,
    micGain,
    musicGain,
    pitchSemitones,
    captureMusicApp,
    pipelineStatus,
    streamUrl,
    setDevices,
    setSelectedDevice,
    setMicGain,
    setMusicGain,
    setPitch,
    setCaptureMusicApp,
    setPipelineStatus,
    setStreamUrl,
  } = useAudioStore()

  const sonosDevices = useDevicesStore((s) => s.devices)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Load audio input devices
  useEffect(() => {
    window.soundbar.audio.getDevices().then((devs) => setDevices(devs as AudioDevice[]))
  }, [setDevices])

  // Listen for pipeline status updates from main process
  useEffect(() => {
    const unsub1 = window.soundbar.audio.onPipelineStatus((status) => {
      setPipelineStatus(status as PipelineStatus)
    })
    const unsub2 = window.soundbar.audio.onStreamUrl((url) => {
      setStreamUrl(url)
    })
    return () => { unsub1(); unsub2() }
  }, [setPipelineStatus, setStreamUrl])

  // Set up AudioContext + analyser for VU meter, pitch shift
  useEffect(() => {
    if (!pipelineStatus.active) return
    const ctx = new AudioContext({ sampleRate: 44100 })
    audioCtxRef.current = ctx

    const analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 256
    analyserNode.connect(ctx.destination)
    setAnalyser(analyserNode)

    // Receive PCM chunks from main process, create AudioBuffer, feed analyser
    const unsub = window.soundbar.audio.onMicChunk((buf: Buffer) => {
      const int16 = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768
      }

      // Pitch shift via a simple time-domain pass (placeholder — returns unchanged for now)
      // A full AudioWorklet pitch shifter would process this properly
      const shifted = applyPitchShift(float32, pitchSemitones)

      // Convert back to Int16 and send to main
      const out = new Int16Array(shifted.length)
      for (let i = 0; i < shifted.length; i++) {
        out[i] = Math.max(-32768, Math.min(32767, Math.round(shifted[i] * 32768)))
      }
      window.soundbar.audio.sendShiftedChunk(Buffer.from(out.buffer))

      // Feed analyser for VU meter
      const audioBuf = ctx.createBuffer(1, shifted.length, 44100)
      audioBuf.copyToChannel(shifted, 0)
      const src = ctx.createBufferSource()
      src.buffer = audioBuf
      src.connect(analyserNode)
      src.start()
    })

    return () => {
      unsub()
      ctx.close()
      setAnalyser(null)
    }
  }, [pipelineStatus.active, pitchSemitones])

  const handleStartPipeline = async () => {
    await window.soundbar.requestMicPermission()
    const config: PipelineConfig = {
      micDeviceIndex: selectedDeviceIndex,
      micGain,
      musicGain,
      pitchSemitones,
      captureMusicApp,
    }
    await window.soundbar.audio.startPipeline(config)
  }

  const handleStopPipeline = () => window.soundbar.audio.stopPipeline()

  const handleMicGain = (v: number) => {
    setMicGain(v)
    window.soundbar.audio.setMicGain(v)
  }

  const handleMusicGain = (v: number) => {
    setMusicGain(v)
    window.soundbar.audio.setMusicGain(v)
  }

  const handleStreamToAll = () => {
    if (!streamUrl) return
    for (const d of sonosDevices.filter((d) => d.isCoordinator)) {
      window.soundbar.sonos.streamToDevice(d.uuid, streamUrl)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Karaoke</h2>
        <StatusBadge active={pipelineStatus.active} label={pipelineStatus.active ? 'Streaming' : 'Off'} />
      </div>

      {/* Input device */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Microphone Input</div>
        <select
          value={selectedDeviceIndex}
          onChange={(e) => setSelectedDevice(parseInt(e.target.value, 10))}
          style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 13,
          }}
        >
          {audioDevices.map((d) => (
            <option key={d.index} value={d.index}>{d.name}</option>
          ))}
          {audioDevices.length === 0 && <option value={0}>Default Microphone</option>}
        </select>
      </div>

      {/* Mix controls + VU meter */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Mix</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Mic Volume</div>
            <Slider value={micGain} min={0} max={2} step={0.01} onChange={handleMicGain} />
          </div>
          <VUMeter analyser={analyser} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Music Volume</div>
            <Slider value={musicGain} min={0} max={2} step={0.01} onChange={handleMusicGain} />
          </div>
        </div>

        {/* Pitch */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span>Voice Pitch</span>
            <span style={{ color: 'var(--accent)' }}>
              {pitchSemitones > 0 ? '+' : ''}{pitchSemitones} st
            </span>
          </div>
          <Slider value={pitchSemitones} min={-12} max={12} step={1} onChange={setPitch} />
        </div>

        {/* Music capture toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={captureMusicApp}
            onChange={(e) => setCaptureMusicApp(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Capture Apple Music audio (mix with mic)
        </label>
      </div>

      {/* Stream URL display */}
      {streamUrl && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Stream URL</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--accent)' }}>
            {streamUrl}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!pipelineStatus.active ? (
          <button
            onClick={handleStartPipeline}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600 }}
          >
            🎤 Start Karaoke
          </button>
        ) : (
          <>
            <button
              onClick={handleStopPipeline}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 14 }}
            >
              Stop
            </button>
            <button
              onClick={handleStreamToAll}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--accent-secondary)', color: '#fff', fontSize: 14, fontWeight: 600 }}
            >
              📡 Send to All Speakers
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function applyPitchShift(samples: Float32Array, semitones: number): Float32Array {
  if (semitones === 0) return samples
  // Simple pitch shift via resampling (affects tempo too, but works without external libs)
  const ratio = Math.pow(2, semitones / 12)
  const outputLength = Math.round(samples.length / ratio)
  const out = new Float32Array(outputLength)
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = i * ratio
    const lo = Math.floor(srcIdx)
    const hi = Math.min(lo + 1, samples.length - 1)
    const frac = srcIdx - lo
    out[i] = samples[lo] * (1 - frac) + samples[hi] * frac
  }
  return out
}
