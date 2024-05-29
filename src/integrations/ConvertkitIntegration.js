const BaseIntegration = require('./BaseIntegration');

class ConvertkitIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.convertkit.com/v3/';
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const { data } = await this.client.get(`/tags?api_secret=${this.apiKey}`);

    return data.tags.map(tag => ({ id: tag.id, name: tag.name }));
  }
}

module.exports = ConvertkitIntegration;
