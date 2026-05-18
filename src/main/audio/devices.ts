import { execSync } from 'child_process'
import type { AudioDevice } from '../../shared/types'

export function getAudioDevices(): AudioDevice[] {
  try {
    // ffmpeg lists devices to stderr
    const output = execSync('ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true', {
      encoding: 'utf8',
      timeout: 5000,
    })
    const devices: AudioDevice[] = []
    let currentType: 'input' | 'output' | null = null
    for (const line of output.split('\n')) {
      if (line.includes('AVFoundation audio devices')) {
        currentType = 'input'
      } else if (line.includes('AVFoundation video devices')) {
        currentType = 'output' // video devices — we skip these but track the section
      }
      const match = line.match(/\[(\d+)\] (.+)/)
      if (match && currentType === 'input') {
        devices.push({
          index: parseInt(match[1], 10),
          name: match[2].trim(),
          type: 'input',
        })
      }
    }
    return devices
  } catch {
    return []
  }
}
