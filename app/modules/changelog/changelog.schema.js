module.exports = {
  getChangeHistory: {
    schema: {
      summary: 'Get list of change logs',
      security: [
        {
          authorization: []
        }
      ],
      body: {
        type: 'object',
        required: ['service', 'module'],
        properties: {
          service: {
            type: 'string'
          },
          module: {
            type: 'string'
          }
        }
      }
    }
  }
}
