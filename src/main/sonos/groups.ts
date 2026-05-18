import { sonosManager } from './manager'

export const sonosGroups = {
  async createGroup(coordinatorUuid: string, memberUuids: string[]): Promise<void> {
    for (const memberUuid of memberUuids) {
      if (memberUuid === coordinatorUuid) continue
      const member = sonosManager.getDevice(memberUuid)
      if (!member) continue
      await member.JoinGroup(coordinatorUuid)
    }
  },

  async dissolveGroup(groupId: string): Promise<void> {
    const manager = sonosManager.getManager()
    if (!manager) return
    let devices
    try {
      devices = manager.Devices?.filter((d) => d.GroupName === groupId) ?? []
    } catch {
      return
    }
    for (const member of devices) {
      try {
        // Leave group by joining a non-existent group (standalone)
        await member.AVTransportService.SetAVTransportURI({
          InstanceID: 0,
          CurrentURI: '',
          CurrentURIMetaData: '',
        }).catch(() => null)
      } catch {
        // skip
      }
    }
  },

  async addToGroup(deviceUuid: string, coordinatorUuid: string): Promise<void> {
    const device = sonosManager.getDevice(deviceUuid)
    if (!device) return
    await device.JoinGroup(coordinatorUuid)
  },
}
