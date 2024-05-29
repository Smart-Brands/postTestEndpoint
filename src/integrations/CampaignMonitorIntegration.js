const BaseIntegration = require('./BaseIntegration');

class CampaignMonitorIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.createsend.com/api/v3.2/';
    this.client.defaults.auth = {
      username: this.apiKey,
      // use dummy password to authorize by api key.
      password: 'x',
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: clients } = await this.client.get('/clients.json');
    
    console.log(JSON.stringify(clients));
    
    const { data } = await this.client.get(
        `/clients/${clients[0].ClientID}/lists.json`,
      );
    
    console.log(JSON.stringify(data));
/*
    const lists = [];
    var i;
    for (i = 0; i < clients.length; i++) {
      const clientId = clients[i].ClientID;
      const subscriberLists = await this.client.get(
        `/clients/${clientId}/lists.json`,
      );
      
      console.log('Subscriber Lists: ' + subscriberLists);

      
      lists.push(...subscriberLists);
    }
*/
          return data.map(list => ({
      id: list.ListID,
      name: list.Name,
    }));
  }
}

module.exports = CampaignMonitorIntegration;
