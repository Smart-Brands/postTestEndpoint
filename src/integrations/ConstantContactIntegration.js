const BaseIntegration = require('./BaseIntegration');

class ConstantContactIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.cc.email/v3';
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/contact_lists',
      }),
    );

    return data.lists.map(list => ({
      id: list.list_id,
      name: list.name,
    }));
  }

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/account/summary',
      }),
    );

    return data.encoded_account_id;
  }

  /**
   * @inheritdoc
   */
  async setToken(token) {
    token.expiresIn(7200);

    return super.setToken(token);
  }

  /**
   * @inheritdoc
   */
  getOAuth2ClientOptions() {
    return {
      clientId: process.env.OAUTH2_CONSTANT_CONTACT_KEY,
      clientSecret: process.env.OAUTH2_CONSTANT_CONTACT_SECRET,
      accessTokenUri: 'https://authz.constantcontact.com/oauth2/default/v1/token',
      authorizationUri: 'https://authz.constantcontact.com/oauth2/default/v1/authorize',
      scopes: ['contact_data', 'account_read', 'offline_access'],
    };
  }
}

module.exports = ConstantContactIntegration;
