const BaseIntegration = require('./BaseIntegration');

class HunterIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.hunter.io/v2/';
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: lists } = await this.client.get(
      `/leads_lists?api_key=${this.apiKey}`,
    );

    return lists.data.leads_lists.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
}

module.exports = HunterIntegration;
