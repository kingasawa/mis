
const { apiKey, apiSecret } = sails.config.shopify;

module.exports = {

  Order: async (job, context, done) => {
    const { type, data } = job;
    const { params } = data;

    let createOrder = {
      shop:params.shop,
      orderid: params.id,
      email: params.email,
      note: params.note,
      token: params.token,
      total_price: params.total_price,
      subtotal_price: params.subtotal_price,
      total_weight: params.total_weight,
      total_tax: params.total_tax,
      currency: params.currency,
      financial_status: params.financial_status,
      confirmed: params.confirmed,
      total_discounts: params.total_discounts,
      total_line_items_price: params.total_line_items_price,
      order_name: params.name,
      email: params.contact_email,
      order_status_url: params.order_status_url,
      line_items: params.line_items,
      billing_address: params.billing_address,
      shipping_address: params.shipping_address,
      customer: params.customer,
      name: params.customer.first_name+' '+params.customer.last_name
    };

    let owner = [];
    let global = 0;
    let totalItem = 0;
    await Promise.all(
      createOrder.line_items.map(async(item)=>{
        totalItem += item.quantity
        let foundPost = await Post.findOne({productid:item.product_id});
        if(!foundPost){
          let foundProduct = await Product.findOne({productId:item.product_id});
          item.src = foundProduct.images[0].src
          return false;
        }

        item.global = foundPost.global;
        item.owner = foundPost.owner;
        item.mpn = foundPost.mpn;
        item.merchant = foundPost.merchant;
        item.image = foundPost.images[0].src;
        owner.push(foundPost.owner);

        if(global === 0){
          createOrder.global = global + 1;
        }
      })
    )
    createOrder.total_item = totalItem;
    createOrder.owner = owner;

    if(type == 'shopifyordercreate'){

      Order.create(createOrder).then((creatOrderSuccess)=>{
        let response = {
          event: 'create/order',
          data: creatOrderSuccess
        };
        done(null,response);
      }).catch((error)=>{
        done(error);
      })
    } else {
      Order.update({orderid:params.id},createOrder).then((updateOrderSuccess)=>{
        let response = {
          event: 'update/order',
          data: updateOrderSuccess
        };
        done(null,response);
      }).catch((error)=>{
        done(error);
      })
    }
  }
};
