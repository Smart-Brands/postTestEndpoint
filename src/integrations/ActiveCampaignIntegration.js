const BaseIntegration = require('./BaseIntegration');

class ActiveCampaignIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = `${this.customProperties.url}/api/3/`;
    this.client.defaults.headers = {
      'Api-Token': this.apiKey,
    };
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    let alllist = [];
    let offset = 0;
    let limit = 100;
    let bool = true;
    while (bool) {
      const { data: response } = await this.client.get(
        `/lists?limit=${limit}&offset=${offset}`,
      );
      alllist.push(...response.lists);
      if (response.lists.length == 0) {
        bool = false;
      }
      offset = offset + limit;
    }

    return alllist.map(list => ({
      id: list.id,
      name: list.name,
    }));
  }

  async getTags() {
    let alltags = [];
    let offset = 0;
    let limit = 100;
    let bool = true;
    while (bool) {
      const { data: response } = await this.client.get(
        `/tags?limit=${limit}&offset=${offset}`,
      );
      alltags.push(...response.tags);
      if (response.tags.length == 0) {
        bool = false;
      }
      offset = offset + limit;
    }

    return alltags.map(tag => ({
      id: tag.id,
      name: tag.tag,
    }));
  }
}

module.exports = ActiveCampaignIntegration;
