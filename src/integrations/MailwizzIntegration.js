const BaseIntegration = require('./BaseIntegration');
const mailWizz = require('node-mailwizz');

class MailwizzIntegration extends BaseIntegration {
  /**
   * @inheritdoc
   */
  async getContactLists() {
    const config = {
      publicKey: this.apiKey,
      secret: this.apiKey,
      baseUrl: this.customProperties.url,
    };

    const lists = new mailWizz.Lists(config);
    const perPage = 50;
    let currentPage = 1;

    let bool = true;
    let alldata = [];
    while (bool) {
      const response = await lists.getLists(currentPage, perPage); // change it to non paginated lists
      
      const rsp = JSON.parse(response);
      
      console.log('Returned Data: ' + response);
      console.log('Parsed Response: ' + rsp);

      if (rsp.data.records.length === 0) {
        bool = false;
        break;
      }
      alldata.push(...rsp.data.records);
      currentPage = currentPage + 1;
    }

    return alldata.map(list => ({
      id: list.general.list_uid,
      name: list.general.name,
    }));
  }
}

module.exports = MailwizzIntegration;
