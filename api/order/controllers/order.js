'use strict';
const fetch = require("node-fetch")
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`, {
  apiVersion: '2020-03-02',
})
const shippo = require('shippo')(`${process.env.SHIPPO_API_TOKEN}`)
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  setupStripe: async (ctx) => {
    let total = 100 // placeholder value
    let validatedCart = []
    let minimalCart = [] // for getting paymentIntent

    // Items & qtys in ctx.request.body
    const {
      salesTaxRate,
      cart
    } = ctx.request.body
    //console.log("setupStripe salesTaxRate", salesTaxRate)

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
      } else if (item.itemType === 'product') {
        const validatedItem = await strapi.services.product.findOne({
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

    total = strapi.config.functions.cart.cartTotal(validatedCart, salesTaxRate)

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        metadata: {
          cart: JSON.stringify(minimalCart)
        },
      });
      return paymentIntent
    } catch (err) {
      return {error: err.raw.message}
    }
  },
/*
  validatePayment: async (ctx) => {
    const { salesTaxRate, paymentIntent } = ctx.request.body

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

    const total = strapi.config.functions.cart.cartTotal(sanitizedCart, salesTaxRate)

    // Make sure the paymentIntent total matches the sanitizedCart total
    if (paymentInfo.amount !== total) {
      ctx.response.status = 402
      return { error: "The paymentIntent amount does not equal the calculated amount." }
    }

  },
*/
  create: async (ctx) => {
    const {
      salesTaxRate,
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
    let products = []
    let card_qty = []
    let sanitizedCart = []

    // Prepare items and quantities for posting of order to Strapi
    await Promise.all(cart.map(async item => {
      if (item.itemType === 'painting') {
        const cmsItem = await strapi.services.painting.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          card_qty.push({
            item_type: 'painting',
            identifier: item.identifier,
            title: item.title,
            qty: item.qty
          })
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
            item_type: 'tradingcard',
            identifier: item.identifier,
            title: item.title,
            qty: item.qty
          })
          tradingcards.push(cmsItem)
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )
          return cmsItem // forces block to complete before continuing
        }
      } else if (item.itemType === 'product') {
        const cmsItem = await strapi.services.product.findOne({
          identifier: item.identifier
        })
        if (cmsItem) {
          card_qty.push({
            item_type: 'product',
            identifier: item.identifier,
            title: item.title,
            qty: item.qty
          })
          products.push(cmsItem)
          sanitizedCart.push(
            {...cmsItem, ...{qty: item.qty}}
          )
          return cmsItem // forces block to complete before continuing
        }
      }
    }))

    let subtotal = strapi.config.functions.cart.cartSubtotal(sanitizedCart)
    let salestax = strapi.config.functions.cart.cartSalesTax(sanitizedCart, salesTaxRate)
    let shipping = strapi.config.functions.cart.cartShipping(sanitizedCart)
    let total = strapi.config.functions.cart.cartTotal(sanitizedCart, salesTaxRate)

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
      products,
      card_qty,

      subtotal,
      salestax,
      shipping,
      total,

      stripe_paymentintent_id
    }

    try {
      const entity = await strapi.services.order.create(entry);
      //console.log("order/create entity", entity)
      const strapi_order = {
        order_id: entity.id,
        order_created: entity.created_at
      }
      //console.log("order/create strapi_order", strapi_order)
      //return sanitizeEntity(entity, { model: strapi.models.order });
      return strapi_order
    } catch (err) {
      console.log("order/create err", err)
    }
  },

  notifyShippo: async (ctx) => {
    //console.log("notifyShippo ctx.request.body", ctx.request.body)
    try {
      const shippo_order = await shippo.order.create(ctx.request.body)
      //console.log("notifyShippo shippo_order", shippo_order)
      return shippo_order
    } catch (err) {
      console.log("notifyShippo err", err)
    }
  },

  getSalestaxRate: async (ctx) => {
    // *** Don't forget to add Public permission in Strapi Roles & Permissions ***
    //console.log("getSalestaxRate ctx.request.body", ctx.request.body)
    try {
      const postal_code = ctx.request.body.postal_code
      const request_url = `${process.env.ZIPTAX_API_URL}?key=${process.env.ZIPTAX_API_KEY}&postalcode=${postal_code}`

      const response = await fetch(request_url)
      const data = await response.json()
      const taxrate = {
        "geoCity": data.results[0].geoCity,
        "taxSales": data.results[0].taxSales
      }
      //console.log("getSalestax taxrate", taxrate)
      return taxrate // Results in expected response, but 404 error on client side!!!
    } catch (err) {
      console.log("getSalestaxRate err", err)
    }
  },
};
