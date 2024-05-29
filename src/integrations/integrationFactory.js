const BaseIntegration = require('./BaseIntegration');
const MailchimpIntegration = require('./MailchimpIntegration');
const SendgridIntegration = require('./SendgridIntegration');
const GetResponseIntegration = require('./GetResponseIntegration');
const ActiveCampaignIntegration = require('./ActiveCampaignIntegration');
const CampaignMonitorIntegration = require('./CampaignMonitorIntegration');
const ConstantContactIntegration = require('./ConstantContactIntegration');
const SalesforceMarketingIntegration = require('./SalesforceMarketingIntegration');
const CampaignerIntegration = require('./CampaignerIntegration');
const FreshworksIntegration = require('./FreshworksIntegration');
const SalesforceIntegration = require('./SalesforceIntegration');
const IContactIntegration = require('./IContactIntegration');
const IntercomIntegration = require('./IntercomIntegration');
const HubspotIntegration = require('./HubspotIntegration');
const HunterIntegration = require('./HunterIntegration');
const KeapIntegration = require('./KeapIntegration');
const ZohoIntegration = require('./ZohoIntegration');
const KlaviyoIntegration = require('./KlaviyoIntegration');
const MailerliteIntegration = require('./MailerliteIntegration');
const GoHighLevelIntegration = require('./GoHighLevelIntegration');
const OngageIntegration = require('./OngageIntegration');
const MaropostIntegration = require('./MaropostIntegration');
const OntraportIntegration = require('./OntraportIntegration');
const BirdSendIntegration = require('./BirdSendIntegration');
const DripIntegration = require('./DripIntegration');
const CustomerIoIntegration = require('./CustomerIoIntegration');
const SendinblueIntegration = require('./SendinblueIntegration');
const BlastableIntegration = require('./BlastableIntegration');
const ConvertkitIntegration = require('./ConvertkitIntegration');
const AweberIntegration = require('./AweberIntegration');
const OutreachIntegration = require('./OutreachIntegration');
const MailwizzIntegration = require('./MailwizzIntegration');
const PostupIntegration = require('./PostupIntegration');
const PardotIntegration = require('./PardotIntegration');
const ApolloIoIntegration = require('./ApolloIoIntegration');
const SendlaneIntegration = require('./SendlaneIntegration');
const EmarsysIntegration = require('./EmarsysIntegration');
const CampaignMonitorCommerceIntegration = require('./CampaignMonitorCommerceIntegration');

const integrations = {
  mailchimp: MailchimpIntegration,
  sendgrid: SendgridIntegration,
  get_response: GetResponseIntegration,
  active_campaign: ActiveCampaignIntegration,
  campaign_monitor: CampaignMonitorIntegration,
  constant_contact: ConstantContactIntegration,
  salesforce_marketing: SalesforceMarketingIntegration,
  freshworks_crm: FreshworksIntegration,
  salesforce: SalesforceIntegration,
  campaigner: CampaignerIntegration,
  icontact: IContactIntegration,
  intercom: IntercomIntegration,
  hubspot: HubspotIntegration,
  hunter: HunterIntegration,
  keap: KeapIntegration,
  zoho: ZohoIntegration,
  klaviyo: KlaviyoIntegration,
  mailerlite: MailerliteIntegration,
  gohighlevel: GoHighLevelIntegration,
  ongage: OngageIntegration,
  maropost: MaropostIntegration,
  ontraport: OntraportIntegration,
  birdsend: BirdSendIntegration,
  drip: DripIntegration,
  customer_io: CustomerIoIntegration,
  sendinblue: SendinblueIntegration,
  blastable: BlastableIntegration,
  convertkit: ConvertkitIntegration,
  aweber: AweberIntegration,
  outreach: OutreachIntegration,
  mailwizz: MailwizzIntegration,
  postup: PostupIntegration,
  pardot: PardotIntegration,
  apolloio: ApolloIoIntegration,
  sendlane: SendlaneIntegration,
  emarsys: EmarsysIntegration,
  campaign_monitor_commerce: CampaignMonitorCommerceIntegration
};

module.exports = {
  /**
   * Creates an integration instance based on the given type and attributes.
   *
   * @param {Object} integrationValues An object of integration values.
   *
   * @returns {BaseIntegration} Integration instance.
   */
  createIntegration(integrationValues) {
    const IntegrationType = integrations[integrationValues.type];

    if (!IntegrationType) {
      throw new Error('Could not find Integration');
    }

    return new IntegrationType(integrationValues);
  },
};
