const { ctr } = require('@cowellness/cw-micro-service')()

/**
 * @class ChangelogActions
 * @classdesc Actions Changelog
 */
class ChangelogActions {
  /**
   *  get change logs
   * @param {*} data
   * @param {*} reply
   * @returns
   */
  async getChangeHistory (data, reply) {
    const changelogs = await ctr.changelog.getChangeHistory(data)

    return reply.cwSendSuccess({
      data: {
        changelogs
      }
    })
  }
}

module.exports = ChangelogActions
