export const SonosChannels = {
  DISCOVER: 'sonos:discover',
  DEVICES_UPDATED: 'sonos:devices-updated',
  PLAY: 'sonos:play',
  PAUSE: 'sonos:pause',
  STOP: 'sonos:stop',
  NEXT: 'sonos:next',
  PREVIOUS: 'sonos:previous',
  SET_VOLUME: 'sonos:set-volume',
  GET_TRACK_INFO: 'sonos:get-track-info',
  CREATE_GROUP: 'sonos:create-group',
  DISSOLVE_GROUP: 'sonos:dissolve-group',
  ADD_TO_GROUP: 'sonos:add-to-group',
  STREAM_TO_DEVICE: 'sonos:stream-to-device',
  STOP_STREAM: 'sonos:stop-stream',
  TEST_BEEP: 'sonos:test-beep',
} as const

export const MusicChannels = {
  PLAY: 'music:play',
  PAUSE: 'music:pause',
  NEXT: 'music:next',
  PREVIOUS: 'music:previous',
  PLAY_TRACK: 'music:play-track',
  SEARCH: 'music:search',
  NOW_PLAYING: 'music:now-playing',
  GET_NOW_PLAYING: 'music:get-now-playing',
} as const

export const AudioChannels = {
  START_PIPELINE: 'audio:start-pipeline',
  STOP_PIPELINE: 'audio:stop-pipeline',
  SET_MIC_GAIN: 'audio:set-mic-gain',
  SET_MUSIC_GAIN: 'audio:set-music-gain',
  SET_PITCH: 'audio:set-pitch',
  GET_DEVICES: 'audio:get-devices',
  MIC_CHUNK: 'audio:mic-chunk',
  SHIFTED_CHUNK: 'audio:shifted-chunk',
  STREAM_URL: 'audio:stream-url',
  PIPELINE_STATUS: 'audio:pipeline-status',
} as const
