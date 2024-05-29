const BaseIntegration = require('./BaseIntegration');

class OngageIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.ongage.net/';
    this.client.defaults.headers = {
      X_USERNAME: this.customProperties.username,
      X_PASSWORD: this.customProperties.password,
      X_ACCOUNT_CODE: this.customProperties.accountCode,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: response } = await this.client.get('/api/lists');

    return response.payload.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }
  
  async getLists() {
    const { data: response } = await this.client.get('/api/lists');
    
    console.log("List Response:" + JSON.stringify(response));
    return response.payload;
  }
  
  async getEmailMessages() {
    const listData = await this.getLists();
    
    let alltag = [];
    var i;
    
    for (i = 0; i < listData.length; i++) {
      const lstid = listData[i]["id"];
      console.log('All Lists: ' + lstid);
      
      const { data: response } = await this.client.get(`${lstid}/api/emails`);
      console.log('Segment Response: ' + JSON.stringify(response));
      
      alltag.push(...response.payload);
      console.log('All Tag Value: ' + alltag);
    } 

    return alltag.map(msg => ({
      id: msg.id + '-' + msg.list_id,
      name: msg.name,
    }));
  }
}

module.exports = OngageIntegration;
