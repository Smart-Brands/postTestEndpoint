const btoa = require('btoa');
const BaseIntegration = require('./BaseIntegration');

class PostupIntegration extends BaseIntegration {
  constructor(props) {
    super(props);
    
    const bscauth = btoa(this.customProperties.username + ':' + this.customProperties.password);

    this.client.defaults.baseURL = 'https://api.postup.com/api/';
    this.client.defaults.headers = {
      Authorization: `Basic ${bscauth}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const { data: response } = await this.client.get('/brand');
    let alldata = [];

    await Promise.all(
      response.map(async brand => {
        const { data: brandResponse } = await this.client.get(
          `/list?brandId=${brand.brandId}`,
        );
        alldata.push(...brandResponse);
      }),
    );

    return alldata.map(list => ({
      id: list.listId,
      name: list.title,
    }));
  }
}

module.exports = PostupIntegration;
