const BaseIntegration = require('./BaseIntegration');

class OntraportIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.ontraport.com/1/';
    this.client.defaults.headers = {
      'Api-Key': this.apiKey,
      'Api-Appid': this.customProperties.appId,
    };
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const { data: response } = await this.client.get('/Tags');

    return response.data.map(tag => ({
      id: tag.tag_id,
      name: tag.tag_name,
    }));
  }
}

module.exports = OntraportIntegration;
