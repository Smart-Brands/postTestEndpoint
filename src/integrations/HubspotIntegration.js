const BaseIntegration = require('./BaseIntegration');

class HubspotIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.hubapi.com';
  }
  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();

    let alllist = [];
    let offset = 0;
    let limit = 250;
    let bool = true;
    while (bool) {
      const { data } = await this.client.request(
        token.sign({
          method: 'get',
          url: `/contacts/v1/lists?count=${limit}&offset=${offset}`,
        }),
      );
      if (data.lists.length == 0) {
        bool = false;
      }
      offset = offset + limit;
      alllist.push(...data.lists);
      //console.log(body.lists)
    }

    return alllist.map(list => ({
      id: list.listId,
      name: list.name,
    }));
  }

  async getUserId(token) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: '/account-info/v3/details',
      }),
    );

    return data.portalId;
  }

  async setToken(token) {
    token.expiresIn(1800);

    return super.setToken(token);
  }

  getOAuth2ClientOptions() {
    return {
      clientId: process.env.OAUTH2_HUBSPOT_KEY,
      clientSecret: process.env.OAUTH2_HUBSPOT_SECRET,
      accessTokenUri: 'https://api.hubapi.com/oauth/v1/token',
      authorizationUri: 'https://app.hubspot.com/oauth/authorize',
      scopes: ['crm.schemas.contacts.write', 'oauth', 'settings.users.teams.write', 'settings.users.teams.read', 'settings.users.write', 'crm.objects.contacts.write', 'crm.lists.write', 'crm.lists.read', 'settings.users.read', 'crm.schemas.contacts.read', 'crm.objects.contacts.read'],
    };
  }
}

module.exports = HubspotIntegration;
