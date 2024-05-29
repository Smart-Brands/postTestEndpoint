const BaseIntegration = require('./BaseIntegration');
const crypto = require('crypto');


class EmarsysIntegration extends BaseIntegration {
    constructor(props) {
        super(props);

        this.client.defaults.baseURL = 'https://api.emarsys.net/api/v2';
        this.client.defaults.headers = {
            'Content-Type': 'application/json',
            'X-WSSE': this.getWsseHeader(this.customProperties.username, this.customProperties.secret)
        };
    }
    /**
     * @inheritdoc
     */
    async getContactLists() {
        const { data } = await this.client.get('/contactlist');

        return data.data.map(list => ({ id: list.id, name: list.name }));
    }
  
  async getEvents() {
        const { data } = await this.client.get('/event');

        return data.data.map(event => ({ id: event.id, name: event.name }));
    }

    getWsseHeader(user, secret) {
        let nonce = crypto.randomBytes(16).toString('hex');
        let timestamp = new Date().toISOString();

        let digest = this.base64Sha1(nonce + timestamp + secret);

        return `UsernameToken Username="${user}", PasswordDigest="${digest}", Nonce="${nonce}", Created="${timestamp}"`
    };

    base64Sha1(str) {
        let hexDigest = crypto.createHash('sha1')
            .update(str)
            .digest('hex');

        return Buffer.from(hexDigest).toString('base64');
    };
}

module.exports = EmarsysIntegration;
