const BaseIntegration = require('./BaseIntegration');

class KeapIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.infusionsoft.com/crm/rest/v1';
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const token = await this.getToken();

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/tags?limit=10000',
      }),
    );

    return data.tags.map(tag => ({
      id: tag.id,
      name: tag.name,
    }));
  }

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/oauth/connect/userinfo',
      }),
    );

    return data.global_user_id;
  }

  /**
   * @inheritdoc
   */
  getOAuth2ClientOptions() {
    return {
      clientId: process.env.OAUTH2_KEAP_KEY,
      clientSecret: process.env.OAUTH2_KEAP_SECRET,
      accessTokenUri: 'https://api.infusionsoft.com/token',
      authorizationUri: 'https://accounts.infusionsoft.com/app/oauth/authorize',
      scopes: ['full'],
    };
  }
}

module.exports = KeapIntegration;
