import Joi from 'joi';
import { Recipient } from 'moonmail-models';

const listRecipientImported = 'lists.recipientImported';

const eventSchemas = {
  [listRecipientImported]: {
    schema: Joi.object({
      type: listRecipientImported,
      payload: Joi.object({
        recipient: Joi.object({
          id: Joi.string().required(),
          email: Joi.string().required().email(),
          listId: Joi.string().required(),
          userId: Joi.string().required(),
          status: Joi.string().valid(Recipient.statuses.subscribed).required(),
          isConfirmed: Joi.boolean().required(),
          metadata: Joi.object().unknown(true)
        }).required(),
        totalRecipients: Joi.number(),
        recipientIndex: Joi.number()
      }).required()
    })
  }
};

const isValid = (event) => {
  try {
    const result = eventSchemas[event.type].schema.validate(event);
    return !result.error;
  } catch (err) {
    return false;
  }
};

export default {
  listRecipientImported,
  isValid
};
