const BaseIntegration = require('./BaseIntegration');

class MaropostIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.maropost.com/';
    this.client.defaults.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const { data: response } = await this.client.get(`/accounts/${this.customProperties.accountId}/tags?auth_token=${this.apiKey}`);

    return response.map(tag => ({
      id: tag.id,
      name: tag.name,
    }));
  }
}

module.exports = MaropostIntegration;
