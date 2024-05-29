const BaseIntegration = require('./BaseIntegration');

class CampaignMonitorCommerceIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://commerce.campaignmonitor.com/api/v1/';
    this.client.defaults.headers = {
      'Content-Type': 'application/json',
      'X-ApiKey': this.apiKey
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/customer-lists');

    return data.map(list => ({ id: list.id, name: list.title }));
  }
}

module.exports = CampaignMonitorCommerceIntegration;
