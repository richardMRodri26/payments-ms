import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import type { PaymentSessionDto } from './dto/payment-session.dto';
import type { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) {}

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

    // return session;

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url
    }

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
    // console.log('event :>> ', event);

    switch (event.type) {
      case "charge.succeeded":
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url
        }
        this.logger.log({ payload  })

        this.logger.log('🚀 Emitting payment.succeeded event');
        this.client.emit('payment.succeeded', payload );
      break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json( { sig })
  }


}
