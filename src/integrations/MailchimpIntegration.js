const BaseIntegration = require('./BaseIntegration');
const mailchimp = require('@mailchimp/mailchimp_marketing');

class MailchimpIntegration extends BaseIntegration {
  /**
   * @inheritdoc
   */
  
  async getContactLists() {
    const [, server] = this.apiKey.split('-');

    mailchimp.setConfig({
      apiKey: this.apiKey,
      server,
    });

    const response = await mailchimp.lists.getAllLists({count:90});

    return response.lists;
  }
  
  async getTags() {
    const [, server] = this.apiKey.split('-');

    mailchimp.setConfig({
      apiKey: this.apiKey,
      server,
    });
    
    const listData = await this.getContactLists();
    
    let alltag = [];
    var i;
    
    for (i = 0; i < listData.length; i++) {
      const lstid = listData[i]["id"];
      console.log('All Lists: ' + lstid);
      
      const body = await mailchimp.lists.listSegments(lstid, {count:1000});
      console.log('Segment Response: ' + JSON.stringify(body));
      
      alltag.push(...body.segments);
      console.log('All Tag Value: ' + JSON.stringify(alltag));
    } 
    
    alltag = alltag.filter(tag => tag.type === 'static');
    console.log('All Tag Value After Filter: ' + JSON.stringify(alltag));
    
    const thistest = alltag.map(tag => ({
      id: tag.id + '-' + tag.list_id,
      name: tag.name,
    }));
    
    console.log('Map Values: ' + JSON.stringify(thistest));
    
    return alltag.map(tag => ({
      id: tag.id + '-' + tag.list_id,
      name: tag.name,
    }));
  }
}

module.exports = MailchimpIntegration;
