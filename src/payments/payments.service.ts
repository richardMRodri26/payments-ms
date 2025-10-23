import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import type { PaymentSessionDto } from './dto/payment-session.dto';
import type { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);


  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map(item => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          // description: item.description,
          // images: item.images
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId: orderId
        }
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl
    });

    return session;

  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.stripeEndpointSecret
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error?.message}`);
      return;
    }
    console.log('event :>> ', event);

    switch (event.type) {
      case "charge.succeeded":
        const chargeSucceeded = event.data.object;
        console.log({ event, metadata: { orderId: chargeSucceeded.metadata.orderId } });
      break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json( { sig })
  }


}
