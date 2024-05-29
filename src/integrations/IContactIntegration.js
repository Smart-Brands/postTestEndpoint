const BaseIntegration = require('./BaseIntegration');

class IContactIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    const { apiAppId, apiUsername, apiPassword } = this.customProperties;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'API-Version': '2.2',
      'API-AppId': apiAppId,
      'API-Username': apiUsername,
      'API-Password': apiPassword,
    };

    this.client.defaults.baseURL = 'https://app.icontact.com/icp/a/';
    this.client.defaults.headers = headers;
  }

  /**
   * @inheritdoc
   */
  async getContactLists() {
    const lists = [];
    const { data: accountsData } = await this.client.get('/');

    for (const account of accountsData.accounts) {
      const { data: foldersData } = await this.client.get(
        `/${account.accountId}/c`,
      );

      for (const folder of foldersData.clientfolders) {
        const { data: subscriberLists } = await this.client.get(
          `/${account.accountId}/c/${folder.clientFolderId}/lists`,
        );

        if (subscriberLists) {
          subscriberLists.lists.forEach(list => {
            lists.push({
              id: `${account.accountId}:${folder.clientFolderId}:${list.listId}`,
              name: `${account.accountId} - ${folder.clientFolderId} - ${list.name}`,
            });
          });
        }
      }
    }

    return lists;
  }
}

module.exports = IContactIntegration;
