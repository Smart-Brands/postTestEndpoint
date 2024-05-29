const jsforce = require('jsforce');
const BaseIntegration = require('./BaseIntegration');

class SalesforceIntegration extends BaseIntegration {
  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();

    const connection = new jsforce.Connection({
      instanceUrl: token.data.instance_url,
      accessToken: token.accessToken,
    });

    const result = await connection.sobject('Campaign').select(['Id', 'Name']);

    return result.map(record => ({
      id: record.Id,
      name: record.Name,
    }));
  }
  
    async getTags() {
    const token = await this.getToken();

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: 'https://pi.pardot.com/api/v5/objects/lists?fields=id,name',
        headers: {
          'Pardot-Business-Unit-Id': '0Uv4o0000008OP6CAM',
        },
      }),
    );

    return data.values.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }

  /**
   * @inheritdoc
   */
  async getUserId(token) {
    const connection = new jsforce.Connection({
      instanceUrl: token.data.instance_url,
      accessToken: token.accessToken,
    });

    const result = await connection.identity();

    return result.user_id;
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
      clientId: process.env.OAUTH2_SALESFORCE_KEY,
      clientSecret: process.env.OAUTH2_SALESFORCE_SECRET,
      accessTokenUri: `https://login.salesforce.com/services/oauth2/token`,
      authorizationUri:
        'https://login.salesforce.com/services/oauth2/authorize',
      scopes: ['api', 'offline_access'],
    };
  }
}

module.exports = SalesforceIntegration;
