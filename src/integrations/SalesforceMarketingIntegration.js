const BaseIntegration = require('./BaseIntegration');

class SalesforceMarketingIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = `https://${this.customProperties.subdomain}.rest.marketingcloudapis.com/`;
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/hub/v1/campaigns',
      }),
    );

    return data.items.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
    }));
  }

  /**
   * @inheritdoc
   */
  async getToken() {
    const client = this.getOAuth2Client();

    return await client.credentials.getToken();
  }

  /**
   * @inheritdoc
   */
  getOAuth2ClientOptions() {
    return {
      clientId: this.customProperties.clientId,
      clientSecret: this.customProperties.clientSecret,
      accessTokenUri: `https://${this.customProperties.subdomain}.auth.marketingcloudapis.com/v2/token`,
      scopes: ['campaign_read', 'campaign_write'],
    };
  }
}

module.exports = SalesforceMarketingIntegration;
