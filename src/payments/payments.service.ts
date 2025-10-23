import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);


  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

    const { currency, items } = paymentSessionDto;

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
      // TODO: Colocar aquí el ID de mi orden
      payment_intent_data: {
        metadata: {
          order_id: '12345'
        }
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    });

    return session;

  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    return res.status(200).json( { sig })
  }


}
