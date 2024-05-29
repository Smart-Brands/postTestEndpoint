const main = require('../main');
const ClientOAuth2 = require('client-oauth2');

class BaseIntegration {
  /**
   * API key.
   *
   * @type {string|null}
   * @public
   */
  apiKey = null;

  /**
   * API custom properties.
   *
   * @type {Object}
   * @public
   */
  customProperties = {};

  /**
   * Axios client.
   *
   * @type {import('axios').AxiosInstance}
   * @public
   */
  client = null;

  constructor(integrationValues) {
    this.apiKey = integrationValues.api_key;
    this.customProperties = integrationValues.custom_properties || {};

    this.client = main.axios.create();
  }

  /**
   * Returns a collection of contact lists.
   *
   * @returns {Object[]} A collection of lists.
   */
  async getContactLists() {
    throw new Error('Not implemented yet');
  }

  /**
   * Returns the OAuth2 user identifier.
   *
   * @returns {string|number}
   */
  async getUserId() {
    throw new Error('Not implemented yet');
  }

  /**
   * Returns the OAuth2 Token instance.
   * Note that integrations.api_key stands for id from access_tokens table.
   *
   * @returns {ClientOAuth2.Token}
   */
  async getToken() {
    const AES_KEY = process.env.MYSQL_AES_KEY;

    const result = await main.sql.query(
      `SELECT
        expires_at,
        CONVERT(AES_DECRYPT(token, ?), CHAR) as access_token,
        CONVERT(AES_DECRYPT(refresh_token, ?), CHAR) as refresh_token,
        CONVERT(AES_DECRYPT(instance_url, ?), CHAR) as instance_url
      FROM access_tokens WHERE id = ?`,
      [AES_KEY, AES_KEY, AES_KEY, this.apiKey],
    );
    await main.sql.end();
    
    console.log('Query Result: ' + JSON.stringify(result));

    if (!result[0]) {
      throw new main.HttpError('Could not find a client to authenticate', 404);
    }

    const data = { instance_url: result[0].instance_url };
    var authData;
    const { accessTokenUri } = this.getOAuth2ClientOptions();
    
    if (accessTokenUri === 'https://api.hubapi.com/oauth/v1/token') {
      authData = { client_id: process.env.OAUTH2_HUBSPOT_KEY, client_secret: process.env.OAUTH2_HUBSPOT_SECRET };
    } else {
      authData = {};
    }
    const client = this.getOAuth2Client({
      query: data,
      body: authData,
    });
    
    console.log('Get Token Client: ' + client);
    const token = client.createToken(
      result[0].access_token,
      result[0].refresh_token,
      'bearer',
      data,
      authData,
    );
    
    console.log('Token: ' + token);
    console.log('Access Token: ' + token.accessToken);
    console.log('Token Expires: ' + token.expires);
    console.log('Refresh Token: ' + token.refreshToken);
    console.log('Instance URL: ' + token.data.instance_url);

    if (result[0].expires_at) {
      token.expiresIn(new Date(result[0].expires_at));
      console.log('Token Expires In: ' + new Date(result[0].expires_at));
    }
    
    console.log('Is Token Expired: ' + token.expired());

    if (token.expired()) {
      console.log('Start Token Expired Function');
      const newToken = await token.refresh();
      console.log('New Token: ' + newToken);
      if (newToken) {
        await this.setToken(newToken);

        return newToken;
      }
    }

    return token;
  }

  /**
   * Set access tokens to database.
   *
   * @param {ClientOAuth2.Token} token The token to set.
   *
   * @returns {number} The new token id.
   */
  async setToken(token) {
    const AES_KEY = process.env.MYSQL_AES_KEY;

    const userId = await this.getUserId(token);
    console.log('User ID: ' + userId);
    const { clientId } = this.getOAuth2ClientOptions();
    console.log('Client ID: ' + clientId);

    const result = await main.sql.query(
      `INSERT INTO access_tokens (client_id, user_id, grant_type, token, expires_at, refresh_token, instance_url)
       VALUES (AES_ENCRYPT(?), ?, 'authorization_code', AES_ENCRYPT(?), ?, AES_ENCRYPT(?), AES_ENCRYPT(?))
       ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at), token = VALUES(token), refresh_token = VALUES(refresh_token), instance_url = VALUES(instance_url)`,
      [
        [clientId, AES_KEY],
        userId,
        [token.accessToken, AES_KEY],
        token.expires,
        [token.refreshToken, AES_KEY],
        [token.data.instance_url || '', AES_KEY],
      ],
    );
    await main.sql.end();
    
    console.log('Insert Query Result: ' + JSON.stringify(result));

    return result.insertId;
  }

  /**
   * Returns an OAuth2 Client instance.
   *
   * @param {ClientOAuth2.Options} options A client options.
   *
   * @returns {ClientOAuth2} A client instance.
   */
  getOAuth2Client(options) {
    return new ClientOAuth2({
      ...this.getOAuth2ClientOptions(),
      ...options,
    });
  }

  /**
   * Returns an OAuth2 Client options.
   *
   * @returns {ClientOAuth2.Options}
   */
  getOAuth2ClientOptions() {
    return {};
  }
}

module.exports = BaseIntegration;
