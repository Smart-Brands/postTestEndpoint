const BaseIntegration = require('./BaseIntegration');

class DripIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.getdrip.com/v2';
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const token = await this.getToken();
    const actid = await this.getUserId(token);

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: `/${actid}/tags`,
      }),
    );

    return data.tags.map(tag => ({
      id: tag,
      name: tag,
    }));
  }

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/accounts',
      }),
    );

    return data.accounts[0].id;
  }

  /**
   * @inheritdoc
   */
  async setToken(token) {
    token.expiresIn(3153600000);

    return super.setToken(token);
  }

  /**
   * @inheritdoc
   */
  getOAuth2ClientOptions() {
    return {
      clientId: process.env.OAUTH2_DRIP_KEY,
      clientSecret: process.env.OAUTH2_DRIP_SECRET,
      accessTokenUri: 'https://www.getdrip.com/oauth/token',
      authorizationUri: 'https://www.getdrip.com/oauth/authorize',
      scopes: ['public'],
    };
  }
}

module.exports = DripIntegration;
