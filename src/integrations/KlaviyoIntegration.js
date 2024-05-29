const BaseIntegration = require('./BaseIntegration');

class KlaviyoIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://a.klaviyo.com/api/v2/';
    
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get(
      `/lists?api_key=${this.apiKey}`,
    );

    return data.map(list => ({
      id: list.list_id,
      name: list.list_name,
    }));
  }
}

module.exports = KlaviyoIntegration;
