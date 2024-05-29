const BaseIntegration = require('./BaseIntegration');

class BirdSendIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.birdsend.co/v1';
  }

  /**
   * @inheritdoc
   */
  async getTags() {
    const token = await this.getToken();
    console.log('Token for getTags Function: ' + token);

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/tags',
        headers: {
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      }),
    );

    console.log(data);

    return data.data.map(tag => ({
      id: tag.tag_id,
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
        url: '/account',
        headers: {
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      }),
    );

    console.log(data);

    return data.account_id;
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
      clientId: process.env.OAUTH2_BIRDSEND_KEY,
      clientSecret: process.env.OAUTH2_BIRDSEND_SECRET,
      accessTokenUri: 'https://app.birdsend.co/oauth/token',
      authorizationUri: 'https://app.birdsend.co/oauth/authorize',
      scopes: ['write'],
    };
  }
}

module.exports = BirdSendIntegration;
