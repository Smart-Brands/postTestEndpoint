const BaseIntegration = require('./BaseIntegration');

class CampaignerIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://edapi.campaigner.com/v1/';
    this.client.defaults.auth = {
      // use dummy username to authorize by api key.
      username: 'hope',
      password: this.apiKey,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/Lists');

    return data.Lists.map(list => ({
      id: list.ListID,
      name: list.Name,
    }));
  }
}

module.exports = CampaignerIntegration;
