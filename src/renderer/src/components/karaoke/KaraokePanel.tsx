import { useState, useEffect, useRef } from 'react'
import { useAudioStore } from '../../store/audioSlice'
import { useDevicesStore } from '../../store/devicesSlice'
import { Slider } from '../shared/Slider'
import { StatusBadge } from '../shared/StatusBadge'
import { VUMeter } from './VUMeter'
import type { AudioDevice, PipelineStatus } from '../../../../shared/types'

export function KaraokePanel() {
  const {
    devices: audioDevices,
    selectedDeviceIndex,
    micGain,
    pitchSemitones,
    pipelineStatus,
    streamUrl,
    setDevices,
    setSelectedDevice,
    setMicGain,
    setPitch,
    setPipelineStatus,
    setStreamUrl,
  } = useAudioStore()

  const sonosDevices = useDevicesStore((s) => s.devices)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [targetUuid, setTargetUuid] = useState<string>('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)

  // Load audio input devices
  useEffect(() => {
    window.soundbar.audio.getDevices().then((devs) => {
      const list = devs as AudioDevice[]
      setDevices(list)
    })
  }, [setDevices])

  // Pre-select first coordinator as target
  useEffect(() => {
    if (!targetUuid && sonosDevices.length > 0) {
      const coordinator = sonosDevices.find((d) => d.isCoordinator) ?? sonosDevices[0]
      setTargetUuid(coordinator.uuid)
    }
  }, [sonosDevices, targetUuid])

  // Listen for pipeline status updates from main
  useEffect(() => {
    const unsub1 = window.soundbar.audio.onPipelineStatus((s) => setPipelineStatus(s as PipelineStatus))
    const unsub2 = window.soundbar.audio.onStreamUrl((url) => setStreamUrl(url))
    return () => { unsub1(); unsub2() }
  }, [setPipelineStatus, setStreamUrl])

  // VU meter via getUserMedia — independent of the backend pipeline
  useEffect(() => {
    let cancelled = false

    async function startMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        micStreamRef.current = stream
        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyserNode = ctx.createAnalyser()
        analyserNode.fftSize = 256
        source.connect(analyserNode)
        setAnalyser(analyserNode)
      } catch {
        // mic permission denied or unavailable — meter stays blank
      }
    }

    startMeter()
    return () => {
      cancelled = true
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
      audioCtxRef.current?.close()
      audioCtxRef.current = null
      setAnalyser(null)
    }
  }, [])

  const handleStartKaraoke = async () => {
    setStreamError(null)
    await window.soundbar.requestMicPermission()
    const status = await window.soundbar.audio.startPipeline({
      micDeviceIndex: selectedDeviceIndex,
      micGain,
      musicGain: 0,
      pitchSemitones,
      captureMusicApp: false,
    }) as PipelineStatus
    if (!status.active) {
      setStreamError(status.error ?? 'Failed to start pipeline.')
    }
  }

  const handleStop = () => {
    window.soundbar.audio.stopPipeline()
    setStreamError(null)
  }

  const handleStreamToSpeaker = async () => {
    if (!streamUrl || !targetUuid) return
    setStreamError(null)
    await window.soundbar.sonos.streamToDevice(targetUuid, streamUrl)
  }

  const handleStreamToAll = () => {
    if (!streamUrl) return
    for (const d of sonosDevices.filter((d) => d.isCoordinator)) {
      window.soundbar.sonos.streamToDevice(d.uuid, streamUrl)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Karaoke</h2>
        <StatusBadge active={pipelineStatus.active} label={pipelineStatus.active ? 'Streaming' : 'Off'} />
      </div>

      {/* Mic input device */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Microphone Input</div>
        <select
          value={selectedDeviceIndex}
          onChange={(e) => setSelectedDevice(parseInt(e.target.value, 10))}
          disabled={pipelineStatus.active}
          style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 13,
            opacity: pipelineStatus.active ? 0.5 : 1,
          }}
        >
          {audioDevices.map((d) => (
            <option key={d.index} value={d.index}>{d.name}</option>
          ))}
          {audioDevices.length === 0 && <option value={0}>Default Microphone</option>}
        </select>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
          Connect AirPods first, then they will appear here. Rescan if needed.
        </div>
        <button
          onClick={() => window.soundbar.audio.getDevices().then((d) => setDevices(d as AudioDevice[]))}
          style={{ marginTop: 8, padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >↺ Refresh devices</button>
      </div>

      {/* Mix controls */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Mix</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Mic Volume</div>
            <Slider value={micGain} min={0.1} max={3} step={0.05} onChange={setMicGain} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, textAlign: 'right' }}>
              {Math.round(micGain * 100)}%
            </div>
          </div>
          <VUMeter analyser={analyser} />
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span>Voice Pitch</span>
            <span style={{ color: 'var(--accent)' }}>
              {pitchSemitones > 0 ? '+' : ''}{pitchSemitones} st
            </span>
          </div>
          <Slider value={pitchSemitones} min={-12} max={12} step={1} onChange={setPitch} />
        </div>
      </div>

      {/* Speaker target */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Stream to Speaker</div>
        <select
          value={targetUuid}
          onChange={(e) => setTargetUuid(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 13,
          }}
        >
          {sonosDevices.map((d) => (
            <option key={d.uuid} value={d.uuid}>{d.name}{d.isCoordinator ? ' (coordinator)' : ''}</option>
          ))}
          {sonosDevices.length === 0 && <option value="">No speakers found</option>}
        </select>
      </div>

      {streamError && (
        <div style={{ fontSize: 12, color: '#f87171', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8 }}>
          ⚠ {streamError}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!pipelineStatus.active ? (
          <button
            onClick={handleStartKaraoke}
            style={{ padding: '10px 0', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600 }}
          >
            🎤 Start Karaoke
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleStreamToSpeaker}
                disabled={!targetUuid || !streamUrl}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: targetUuid && streamUrl ? '#16a34a' : 'var(--bg-elevated)',
                  color: targetUuid && streamUrl ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                📡 Send to Speaker
              </button>
              <button
                onClick={handleStreamToAll}
                disabled={!streamUrl}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: streamUrl ? 'var(--accent-secondary)' : 'var(--bg-elevated)',
                  color: streamUrl ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                📡 All Speakers
              </button>
            </div>
            <button
              onClick={handleStop}
              style={{ padding: '10px 0', borderRadius: 10, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 14 }}
            >
              Stop
            </button>
          </>
        )}
      </div>

      {streamUrl && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Stream URL</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--accent)' }}>
            {streamUrl}
          </div>
        </div>
      )}
    </div>
  )
}
