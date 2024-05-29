const BaseIntegration = require('./BaseIntegration');

class SendinblueIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.sendinblue.com/v3/';
    this.client.defaults.headers = {
      'api-key': this.apiKey,
      Accept: 'application/json',
    };
    
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get(
      `/contacts/lists`,
    );

    return data.lists.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
}

module.exports = SendinblueIntegration;
