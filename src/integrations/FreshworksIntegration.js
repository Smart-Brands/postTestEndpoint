const BaseIntegration = require('./BaseIntegration');

class FreshworksIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = this.customProperties.url;
    this.client.defaults.headers = {
      Authorization: `Token token=${this.apiKey}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: views } = await this.client.get(
      '/crm/sales/api/sales_accounts/filters',
    );

    const { data: accounts } = await this.client.get(
      `/crm/sales/api/sales_accounts/view/${views.filters[0].id}`,
    );

    return accounts.sales_accounts.map(account => ({
      id: account.id,
      name: account.name,
    }));
  }
}

module.exports = FreshworksIntegration;
