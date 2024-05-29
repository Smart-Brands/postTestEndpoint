const BaseIntegration = require('./BaseIntegration');

class ApolloIoIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.apollo.io/v1/';
    this.client.defaults.headers = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data } = await this.client.get(`/labels?api_key=${this.apiKey}`);

    return data.map(list => ({ id: list.id, name: list.name }));
  }
  
  async getCustomFields() {
    const { data } = await this.client.get(`/typed_custom_fields?api_key=${this.apiKey}`);

    return data.typed_custom_fields.map(field => ({ id: field.id, name: field.name }));
  }
}

module.exports = ApolloIoIntegration;
