const sendgrid = require('@sendgrid/client');
const BaseIntegration = require('./BaseIntegration');

class SendgridIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    sendgrid.setApiKey(this.apiKey);
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const [_, body] = await sendgrid.request({
      method: 'GET',
      url: '/v3/marketing/lists',
    });

    return body.result;
  }
}

module.exports = SendgridIntegration;
