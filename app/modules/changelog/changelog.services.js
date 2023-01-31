const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/changelog/set', ({ data }) => {
  console.log(data)
  return ctr.changelog.create(data)
})
