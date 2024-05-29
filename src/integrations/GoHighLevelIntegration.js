const BaseIntegration = require('./BaseIntegration');

class GoHighLevelIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://rest.gohighlevel.com/v1/';
    this.client.defaults.headers = {
      Authorization: `Bearer ${this.customProperties.accessToken}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const { data } = await this.client.get('/tags');

    return data.tags.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
}

module.exports = GoHighLevelIntegration;
