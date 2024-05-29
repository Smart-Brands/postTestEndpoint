const BaseIntegration = require('./BaseIntegration');

class OutreachIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.outreach.io/api/v2';
  }

  /**
   * @inheritdoc
   */
  
  /*
  async getTags() {
    const token = await this.getToken();

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: `/accounts`,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    console.log(JSON.stringify(data));

    return data.data.attributes.tags.map(tag => ({
      id: tag,
      name: tag,
    }));
  }
  */

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/users',
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    console.log(data);

    return data.data[0].id;
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
      clientId: process.env.OAUTH2_OUTREACH_KEY,
      clientSecret: process.env.OAUTH2_OUTREACH_SECRET,
      accessTokenUri: 'https://api.outreach.io/oauth/token',
      authorizationUri: 'https://api.outreach.io/oauth/authorize',
      scopes: ['accounts.all', 'prospects.all', 'emailAddresses.all', 'users.all'],
    };
  }
}

module.exports = OutreachIntegration;
