'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST)

module.exports = {
  setupStrapi: async (ctx) => {
    let total = 100
    let validatedCart = []
    let minimalCart = [] // for getting paymentIntent

    // Items & qtys in ctx.request.body
    const { cart } = ctx.request.body

    await Promise.all(cart.map(async item => {
      if (item.itemType === 'painting') {
        const validatedItem = await strapi.services.painting.findOne({
          id: item.id
        })

        //console.log("validatedItem", validatedItem)
        if (validatedItem) {
          validatedItem.qty = item.qty

          validatedCart.push(validatedItem)

          minimalCart.push({
            id: item.identifier,
            qty: item.qty
          })

          return validatedItem // forces block to complete before continuing
        }
      } else if (item.itemType === 'tradingcard') {
        const validatedItem = await strapi.services.tradingcard.findOne({
          id: item.id
        })

        //console.log("validatedItem", validatedItem)
        if (validatedItem) {
          validatedItem.qty = item.qty

          validatedCart.push(validatedItem)

          minimalCart.push({
            id: item.identifier,
            qty: item.qty
          })

          return validatedItem // forces block to complete before continuing
        }
      }

    }))
    //console.log("validatedCart", validatedCart)
    //console.log("minimalCart", minimalCart)

    total = strapi.config.functions.cart.cartTotal(validatedCart)

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        // Verify your integration in this guide by including this parameter
        //metadata: {integration_check: 'accept_a_payment'},
        metadata: {cart: JSON.stringify(minimalCart)},
      });

      return paymentIntent
    } catch (err) {
      return {error: err.raw.message}
    }
  }
};
