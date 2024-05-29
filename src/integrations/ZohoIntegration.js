const BaseIntegration = require('./BaseIntegration');

class ZohoIntegration extends BaseIntegration {
  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();
    const baseURL = this.getInstanceUrl(token).replace('accounts', 'campaigns');

    const { data } = await this.client.request(
      token.sign({
        baseURL,
        method: 'get',
        url: `/api/v1.1/getmailinglists?resfmt=JSON`,
      }),
    );

    return data.list_of_details.map(list => ({
      id: list.listkey,
      name: list.listname,
    }));
  }

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const baseURL = this.getInstanceUrl(token.client.options);

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: `${baseURL}/oauth/user/info`,
      }),
    );

    return data.ZUID;
  }

  /**
   * @inheritdoc
   */
  async setToken(token) {
    token.data.instance_url = this.getInstanceUrl(token.client.options);

    return super.setToken(token);
  }

  /**
   * @inheritdoc
   */
  getOAuth2Client(options = {}) {
    const baseURL = this.getInstanceUrl(options);

    return super.getOAuth2Client({
      accessTokenUri: `${baseURL}/oauth/v2/token`,
      ...options,
    });
  }

  getInstanceUrl(options = {}) {
    if (options.data && options.data.instance_url) {
      return options.data.instance_url;
    }

    if (options.query && options.query.instance_url) {
      return options.query.instance_url;
    }

    if (options.query && options.query['accounts-server']) {
      return options.query['accounts-server'];
    }

    return 'https://accounts.zoho.com';
  }

  /**
   * @inheritdoc
   */
  getOAuth2ClientOptions() {
    return {
      clientId: process.env.OAUTH2_ZOHO_KEY,
      clientSecret: process.env.OAUTH2_ZOHO_SECRET,
      accessTokenUri: 'https://accounts.zoho.com/oauth/v2/token',
      authorizationUri:
        'https://accounts.zoho.com/oauth/v2/auth?prompt=consent&access_type=offline',
      scopes: ['ZohoCampaigns.contact.ALL', 'Aaaserver.profile.read'],
    };
  }
}

module.exports = ZohoIntegration;
