const BaseIntegration = require('./BaseIntegration');

class MailerliteIntegration extends BaseIntegration {
  constructor(props) {
    super(props);
    
    this.client.defaults.baseURL = 'https://api.mailerlite.com/api/v2/';
    this.client.defaults.headers = {
      'X-MailerLite-ApiKey': this.apiKey,
    };
    
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/groups');

    return data.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
}

module.exports = MailerliteIntegration;
