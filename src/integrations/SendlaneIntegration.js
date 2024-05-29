const BaseIntegration = require('./BaseIntegration');

class SendlaneIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.sendlane.com/v2/';
    this.client.defaults.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.customProperties.accessToken}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get('/lists');

    return data.data.map(list => ({ id: list.id, name: list.name }));
  }
  
  async getTags() {
    const { data } = await this.client.get('/tags');

    return data.data.map(tag => ({ id: tag.id, name: tag.name }));
  }
}

module.exports = SendlaneIntegration;
