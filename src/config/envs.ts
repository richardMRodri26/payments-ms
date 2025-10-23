import 'dotenv/config';
import * as joi from 'joi';

export interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_ENDPOINT_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
}

const envsSchema = joi.object<EnvVars>({
  PORT: joi.number().required(),
  STRIPE_SECRET: joi.string().required(),
  STRIPE_ENDPOINT_SECRET: joi.string().required(),
  STRIPE_SUCCESS_URL: joi.string().uri().required(),
  STRIPE_CANCEL_URL: joi.string().uri().required(),
})
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars = value;



export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
}