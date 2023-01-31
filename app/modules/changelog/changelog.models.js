const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.changelog.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: String
    },
    service: {
      type: String
    },
    module: {
      type: String
    },
    data: {
      type: Object
    },
    changedBy: {
      profileId: {
        type: String
      },
      managerId: {
        type: String,
        default: null
      },
      impersonatorId: {
        type: String,
        default: null
      }
    }
  },
  { timestamps: true }
)

module.exports = db.changelog.model('Changelog', newSchema)
