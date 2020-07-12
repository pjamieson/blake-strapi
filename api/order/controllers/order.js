'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
/**
 * Read the documentation
 * (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  setupStripe: async (ctx) => {
    let total = 100
    let validatedCart = []
    let responseCart = []

    // ctx.request.body contains cart paintings, cards, and card quantities
    const {cart} = ctx.request.body
    console.log("strapi.services", strapi.services)

    await Promise.all(cart.map(async item => {
      const validatedItem = await strapi.services.painting.findOne({
        strapiId: cart.id
      })
      console.log("validatedItem", validatedItem)

      if (validatedItem) {
        validatedItem.qty = item.qty
        validatedCart.push(validatedItem)
        responseCart.push({
          id: item.id,
          qty: item.qty
        })
      }

      return validatedItem // forces waiting for result before continuing
    }))
    console.log("validatedCart", validatedCart)

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        metadata: {cart: JSON.stringify(responseCart)},
        //metadata: {integration_check: 'accept_a_payment'},
      });
      return paymentIntent
    } catch (err) {
      return { error: err.raw.message }
    }
  }
};
