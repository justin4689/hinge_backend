import stripe from '../config/stripe.js'
import User from '../models/User.js'

export async function createCheckoutSession(req, res, next) {
  try {
    const { plan } = req.body
    const priceId = plan === 'plus' ? process.env.STRIPE_PRICE_PLUS : process.env.STRIPE_PRICE_X
    if (!priceId) return res.status(400).json({ success: false, error: 'INVALID_PLAN' })

    let customerId = req.user.subscription?.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user.email })
      customerId = customer.id
      await User.findByIdAndUpdate(req.user._id, { 'subscription.stripeCustomerId': customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    })
    res.json({ success: true, data: { url: session.url } })
  } catch (err) {
    next(err)
  }
}

export async function handleWebhook(req, res, next) {
  try {
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'INVALID_SIGNATURE' })
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const plan = sub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_PLUS ? 'plus' : 'x'
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': sub.customer },
          {
            'subscription.plan': plan,
            'subscription.status': sub.status,
            'subscription.stripeSubId': sub.id,
            'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
          }
        )
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': sub.customer },
          {
            'subscription.plan': 'free',
            'subscription.status': 'inactive',
            'subscription.stripeSubId': null,
            'subscription.currentPeriodEnd': null,
          }
        )
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    next(err)
  }
}
