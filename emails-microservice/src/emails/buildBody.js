import * as Liquid from 'liquid-node';
import Promise from 'bluebird';
import buildOpenTrackingCode from './buildOpenTrackingCode';

const liquid = new Liquid.Engine();

const footerTemplate = ({ to, unsubscribeUrl, metafields }) => `
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tbody>
    <tr>
      <td align="center" valign="top" style="padding-top:20px;padding-bottom:20px">
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tbody>
            <tr>
              <td align="center" valign="top" style="color:#666;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:23px;padding-right:20px;padding-bottom:5px;padding-left:20px;text-align:center">
                This email was sent to<span>&nbsp;</span>
                <a href="mailto:${to}" style="color:rgb(64,64,64)!important" target="_blank">${to}</a><span>&nbsp;|&nbsp;</span>
                <a href="${unsubscribeUrl}" style="color:rgb(64,64,64)!important" target="_blank">Unsubscribe from this list</a>
                <br />
                ${metafields.address}
                <a href="https://moonmail.io/?utm_source=newsletter&utm_medium=moonmail-user&utm_campaign=user-campaigns" target="_blank">
                  <img src="https://s3-eu-west-1.amazonaws.com/static.moonmail.prod.eu-west-1/moonmail-logo.png" border="0" alt="Email Marketing Powered by MoonMail" title="MoonMail Email Marketing" width="130" height="28" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
`;


export default function buildBody(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, footerRequired, unsubscribeUrl, attachments, apiHostname }) {
  return Promise.props({
    mainBodyContent: buildMainBodyContent(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }),
    openTrackingCode: buildOpenTrackingCode({ recipientId, listId, campaignId, userId, segmentId, apiHostname }),
    footer: buildFooter(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname })
  }).then((bodyTrackingCodeFooter) => {
    const body = `${bodyTrackingCodeFooter.mainBodyContent} ${bodyTrackingCodeFooter.openTrackingCode}`;
    if (footerRequired) return `${body} ${bodyTrackingCodeFooter.footer}`;
    return body;
  });
}
const buildMainBodyContent = function buildMainBodyContent(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }) {
  const extraMetafields = { recipient_email: emailTemplate.to, from_email: emailTemplate.from, unsubscribe_url: unsubscribeUrl };
  const allMetafields = Object.assign({}, metafields, extraMetafields);
  return liquid.parseAndRender(emailTemplate.body, allMetafields);
};

const buildFooter = function buildFooter(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }) {
  const { to } = emailTemplate;
  return Promise.resolve(footerTemplate({ to, unsubscribeUrl, metafields }));
};
