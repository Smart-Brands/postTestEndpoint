const BaseIntegration = require('./BaseIntegration');

class BlastableIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://blastable.com/api/';
    this.client.defaults.headers = {
      Accept: 'application/json',
      'X-BLASTABLE-PUBLIC-KEY': this.apiKey,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/lists');

    return data.data.records.map(list => ({ id: list.general.list_uid, name: list.general.name }));
  }
}

module.exports = BlastableIntegration;
