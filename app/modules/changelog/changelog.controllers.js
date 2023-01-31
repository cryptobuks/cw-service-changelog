const { db, rabbitmq, _ } = require('@cowellness/cw-micro-service')()
const justdiff = require('just-diff')
/**
 * @class ChangelogController
 * @classdesc Controller Changelog
 */
class ChangelogController {
  constructor () {
    this.Changelog = db.changelog.model('Changelog')
  }

  /**
   * Create a message in changelog
   * @returns created message
   */
  async create ({ profileId, service, module, oldData, newData }) {
    const diff = justdiff.diff(oldData, newData)

    if (!diff.length) {
      return null
    }
    this.sendMessagesOnChange({ profileId, service, module, diff, data: newData })

    const changedBy = await this.getChangedByUser(profileId)

    return this.Changelog.create({
      profileId,
      service,
      module,
      data: diff,
      changedBy: {
        profileId,
        managerId: changedBy?.managerId || null,
        impersonatorId: changedBy?.impersonatorId || null
      }
    })
  }

  /**
   * list history for changes
   * @returns changes history
   */
  getChangeHistory ({ _user, service, module }) {
    return this.Changelog.find({
      profileId: _user.profileId,
      service,
      module
    })
  }

  /**
   * sends a message to a service
   */
  sendMessagesOnChange ({ profileId, service, module, diff, data }) {
    switch (service) {
      case 'auth':
        if (module === 'profile') {
          this.sendMessageIbanChange(profileId, diff, data)
        }
        break
    }
  }

  /**
   * sends a chat message on iban or pin change
   * @param {*} profileId profile id sending message
   * @param {*} diff difference in data
   * @param {*} data the actual new data
   */
  async sendMessageIbanChange (profileId, diff, data) {
    const isIBANChanged = diff.find(item => item.path[0] === 'person' && item.path[1] === 'banks' && item.path[3] === 'iban')
    const isPinChanged = diff.find(item => item.path[0] === 'ids' && item.path[2] === 'value' && _.get(data, ['ids', item.path[1], 'key']) === 'pin')
    let field = null

    if (isIBANChanged) {
      field = 'IBAN'
    } else if (isPinChanged) {
      field = 'Pin'
    }
    if (!field) {
      return
    }
    const { data: chatMessage } = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: 'm1.iban-changed.message',
      type: 'chat',
      data: {
        field
      }
    })
    const { data: relations } = await rabbitmq.sendAndRead('/auth/relation/get', {
      profileId,
      managerId: profileId
    })

    relations.forEach(relation => {
      if (!['IN', 'TU'].includes(relation.profile.typeCode) && relation.status === 'active') {
        rabbitmq.sendAndRead('/chat/message/action/create', {
          frontId: `auth-${Date.now()}`,
          fromProfileId: profileId,
          toProfileId: relation.profile._id.toString(),
          content: {
            type: 'action',
            text: chatMessage,
            actions: [
              {
                label: 'global.view',
                showTo: ['to'],
                frontend: {},
                backend: {}
              }
            ]
          }
        })
      }
    })
  }

  async getChangedByUser (profileId) {
    const { data } = await rabbitmq.sendAndRead('/ws/socket/get', {
      profileId,
      managerId: '*'
    })

    return _.first(_.orderBy(data, 'lastUpdate', 'desc'))
  }
}

module.exports = ChangelogController
