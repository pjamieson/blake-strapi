'use strict';
const stripe = require('stripe')(`${process.env.STRIPE_SK}`)
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  setupStripe: async (ctx) => {
    let total = 100 // placeholder value
    let validatedCart = []
    let minimalCart = [] // for getting paymentIntent

    // Items & qtys in ctx.request.body
    const { cart } = ctx.request.body

    await Promise.all(cart.map(async item => {
      if (item.itemType === 'painting') {
        const validatedItem = await strapi.services.painting.findOne({
          identifier: item.identifier
        })

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
          identifier: item.identifier
        })

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
  },
/*
  validatePayment: async (ctx) => {
    const { paymentIntent } = ctx.request.body

    let paymentInfo

    // Check paymentIntent status
    try {
      paymentInfo = await stripe.paymentIntents.retrieve(paymentIntent.id)
      if (paymentInfo.status !== 'succeeded') {
        throw { message: "Payment processing did not succeed. Please try again."}
      }
    } catch (err) {
      ctx.response.status = 402
      return { error: err.message }
    }

    // Check that paymentIntent was not previously used for an existing orders
    const existingOrder = await strapi.services.order.findOne({
      stripe_paymentintent_id: paymentIntent.id
    })

    if (existingOrder && existingOrder.length > 0) {
      ctx.response.status = 402
      return { error: "This paymentIntent was used for another order." }
    }

    let sanitizedCart = []

    // Build sanitiezedCart for comparing backend total with client total
    await Promise.all(cart.map(async item => {
      if (item.itemType === 'painting') {
        const cmsItem = await strapi.services.painting.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )

          return cmsItem // forces block to complete before continuing
        }
      } else if (item.itemType === 'tradingcard') {
        const cmsItem = await strapi.services.tradingcard.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )

          return cmsItem // forces block to complete before continuing
        }
      }
    }))

    const total = strapi.config.functions.cart.cartTotal(sanitizedCart)

    // Make sure the paymentIntent total matches the sanitizedCart total
    if (paymentInfo.amount !== total) {
      ctx.response.status = 402
      return { error: "The paymentIntent amount does not equal the calculated amount." }
    }

  },
*/
  create: async (ctx) => {
    const {
      paymentIntent,
      firstname,
      lastname,
      address,
      address2,
      city,
      state,
      zip,
      country,
      email,
      newsletter,
      cart
    } = ctx.request.body

    let paintings = []
    let tradingcards = []
    let card_qty = []
    let sanitizedCart = []

    // Prepare items and quantities for posting of order to Strapi
    await Promise.all(cart.map(async item => {
      if (item.itemType === 'painting') {
        const cmsItem = await strapi.services.painting.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          paintings.push(cmsItem)
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )

          return cmsItem // forces block to complete before continuing
        }
      } else if (item.itemType === 'tradingcard') {
        const cmsItem = await strapi.services.tradingcard.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          card_qty.push({
            identifier: item.identifier,
            qty: item.qty
          })
          tradingcards.push(cmsItem)
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )

          return cmsItem // forces block to complete before continuing
        }
      }
    }))

    let subtotal = strapi.config.functions.cart.cartSubtotal(sanitizedCart)
    let salestax = strapi.config.functions.cart.cartSalesTax(sanitizedCart)
    let shipping = strapi.config.functions.cart.cartShipping(sanitizedCart)
    let total = strapi.config.functions.cart.cartTotal(sanitizedCart)

    total = total * .01 // Unlike Stripe, Strapi expects dollars, not cents

    const stripe_paymentintent_id = paymentIntent.id

    const entry = {
      firstname,
      lastname,
      address,
      address2,
      city,
      state,
      zip,
      country,
      email,
      newsletter,

      paintings,
      tradingcards,
      card_qty,

      subtotal,
      salestax,
      shipping,
      total,

      stripe_paymentintent_id
    }

    const entity = await strapi.services.order.create(entry);

    return sanitizeEntity(entity, { model: strapi.models.order });
  },

  notifyShippo: async (ctx) => {
    try {
      const response = await fetch(`${process.env.SHIPPO_API_URL}/orders`, {
        method: "POST",
        headers: {
          "Authorization": `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ctx.request.body)
      })
      const data = await response.json()
      console.log("notifyShippo post data", data)
    } catch (err) {
      console.log("notifyShippo post error", err)
    }
  },
};
