// Replicates functions from blake-dot-art/src/utils/cart.js
// A private Node package that both projects use would be a better solution

const SALES_TAX_RATE = process.env.SALES_TAX_RATE || 0.00

const cartSubtotal = (cart) => {
  const subtotal = cart.reduce((counter, item) => {
    return counter + item.price * item.qty
  }, 0)

  return subtotal
}

const cartTotal = (cart) => {
  const subtotal = cartSubtotal(cart)
  const total = subtotal + (subtotal * SALES_TAX_RATE)

  return total * 100 // Stripe requires integer in cents, not dollar decimal
}

module.exports = {
  cartSubtotal,
  cartTotal,
}
