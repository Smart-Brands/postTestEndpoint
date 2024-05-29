const BaseIntegration = require('./BaseIntegration');

class GetResponseIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.getresponse.com/v3/';
    this.client.defaults.headers = {
      'X-Auth-Token': `api-key ${this.apiKey}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/campaigns');

    return data.map(list => ({ id: list.campaignId, name: list.name }));
  }
}

module.exports = GetResponseIntegration;
