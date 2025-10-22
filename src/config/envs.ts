import 'dotenv/config';
import * as joi from 'joi';

export interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;

}

const envsSchema = joi.object<EnvVars>({
  PORT: joi.number().required(),
  STRIPE_SECRET: joi.string().required()
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
}