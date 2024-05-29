const BaseIntegration = require('./BaseIntegration');

class CustomerIoIntegration extends BaseIntegration {
  constructor(props) {
    super(props);

    this.client.defaults.baseURL = 'https://api.customer.io/v1/';
    this.client.defaults.headers = {
      Authorization: `Bearer ${this.customProperties.appApiKey}`,
    };
  }

  /**
   * @inheritdoc
   */
  async getSegments() {
    const { data } = await this.client.get('/segments');
    
    const cntseg = data.segments.filter(segmt => segmt.type === 'manual');

    return cntseg.map(segment => ({
      id: segment.id,
      name: segment.name,
    }));
  }
}

module.exports = CustomerIoIntegration;
