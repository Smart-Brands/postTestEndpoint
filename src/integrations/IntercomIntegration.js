const BaseIntegration = require('./BaseIntegration');

class IntercomIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.intercom.io/';
    this.client.defaults.headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.customProperties.accessToken}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: companies } = await this.client.get('/companies');

    return companies.data.map(company => ({
      id: company.id,
      name: company.name,
    }));
  }
}

module.exports = IntercomIntegration;
