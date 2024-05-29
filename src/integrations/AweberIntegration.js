const BaseIntegration = require('./BaseIntegration');

class AweberIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.aweber.com/1.0';
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const token = await this.getToken();
    
    const actid = await this.getUserId(token);

    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: `/accounts/${actid}/lists`,
      }),
    );

    return data.entries.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
  
  async getAllLists(token, actid) {
    const { data } = await this.client.request(
      token.sign({
        method: 'get',
        url: `/accounts/${actid}/lists`,
      }),
    );

    return data.entries;
  }
  
  async getTags() {
    const token = await this.getToken();
    
    const actid = await this.getUserId(token);
    
    const listData = await this.getAllLists(token, actid);
    
    let alltag = [];
    var i;
    
    for (i = 0; i < listData.length; i++) {
      const lstid = listData[i]['id'];
      console.log('All Lists: ' + lstid);
      
      const { data } = await this.client.request(
        token.sign({
          method: 'get',
          url: `/accounts/${actid}/lists/${lstid}/tags`,
        }),
      );

      console.log('Tag Response: ' + JSON.stringify(data));
      
      const addlstId = data.map(tag => ({
        id: tag + '+' + lstid,
        name: tag,
      }));
      
      console.log('Map Values: ' + JSON.stringify(addlstId));

      alltag.push(...addlstId);
      console.log('All Tag Value: ' + JSON.stringify(alltag));
    }

    return alltag;
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

    return data.entries[0].id;
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
      clientId: process.env.OAUTH2_AWEBER_KEY,
      clientSecret: process.env.OAUTH2_AWEBER_SECRET,
      accessTokenUri: 'https://auth.aweber.com/oauth2/token',
      authorizationUri: 'https://auth.aweber.com/oauth2/authorize',
      scopes: ['account.read', 'list.read', 'subscriber.read', 'subscriber.write'],
    };
  }
}

module.exports = AweberIntegration;
