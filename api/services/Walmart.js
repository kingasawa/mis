import axios from 'axios';
const apiKey = 'hu5rpk7mstvzqxnmmeu495x6'

module.exports = {

  getItem: async (id) => {
    let itemData = {}
    let url =`http://api.walmartlabs.com/v1/items/${id}?apiKey=${apiKey}&format=json`
    // let getVariants =`http://api.walmartlabs.com/v1/items?ids=518575401,189453116,435647969,579723256,712118804,912412386,323151929&apiKey=${apiKey}&format=json`
    let findPost = await Post.find({wip:id})
    console.log('findPost', findPost);
    if(findPost.length !== 0){
      return {
        status: 400,
        message: `existed`,
        item: findPost,
      }
    }

    await axios.get(url)
         .then(async (response)=> {
           console.log('response.data', response.data);
           itemData = {
             status: response.status,
             message: response.statusText,
             item: response.data,
           }
           itemData.item.color = [response.data.color];
           itemData.item.size = [response.data.size];
           let {variants} = response.data
           if(variants){
             let i = variants.indexOf(id);
             if(i !== -1) {
               variants = variants.splice(i, 1);
             }
             variants = variants.slice(0,19).toString()
             let getVariants =`http://api.walmartlabs.com/v1/items?ids=${id},${variants}&apiKey=${apiKey}&format=json`
             console.log('variants', variants);
             let color = []
             let size = []
             await axios.get(getVariants).then(async(res)=>{
               // let (i,i<=res.data.items.length,i++){
               //   console.log('i', i);
               //   color.push(res.data.items[i])
               // }
               _.each(res.data.items, ( item,index )=> {
                 color.push(item.color)
                 size.push(item.size)
               });
               itemData = {
                 status: res.status,
                 message: res.statusText,
                 item: res.data.items[0],
               }
               itemData.item.color = _.uniq(color);
               itemData.item.size = _.uniq(size);
             }).catch((err)=>{
               console.log('err', err);
             })
           } else {

           }

         })
         .catch( (error)=> {
           console.log('error', error);
           itemData = {
             status: 400,
             message: 'item is not found',
             item: {}
           }
         });
    console.log('itemData', itemData);
    return itemData
  },

  quick_add: async (params) => {
    console.log('quick add params', params);
    let { itemId, owner, stock, title, description, price, brand, upc, size, color, images, category } = params
    if(stock !== 'Available'){
      return {
        error: 'not available'
      }
    }

    let variants = []
    let options = []
    if(size.length < 1 && color.length < 1){
      console.log('ko co cai nao');
      variants = [{
        title, price,
        compare_at_price:price,
        barcode:upc,
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        inventory_quantity: 5
      }]
    } else if (size.length < 1 && color.length > 0){
      console.log('ko co size , co color');
      _.each(color,(c,i)=>{
        variants.push({
          title: c ,
          option2: c,
          price,
          compare_at_price:price,
          barcode:upc,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          inventory_quantity: 5,
        })
      })
      options = [{"name":"Color"}]
    } else if (size.length > 0 && color.length < 1){
      console.log('ko co color , co size');

      _.each(size,(s,i)=>{
        variants.push({
          title: s ,
          option1: s,
          price,
          compare_at_price:price,
          barcode:upc,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          inventory_quantity: 5
        })
      })
        options = [{"name":"Size"}]
    } else {
      console.log('co ca 2');
      variants = []
      _.each(size,(s,i)=>{
        _.each(color,(c,i)=>{
          variants.push({
            title: `${s} • ${c}`,
            option1:s,
            option2:c,
            price,
            compare_at_price:price,
            barcode:upc,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            inventory_quantity: 5
          })
        })
      })
        options = [{"name":"Size"},{"name":"Color"}]
    }

    let createData = {
      title,price,brand,images,
      wip:itemId,
      body_html:`<p>${description}</p>`,
      stock:5,
      category: category.split(' ')[0],
      compare_at_price:price,
      gtin:upc,
      option1:size.toString(),
      option2:color.toString(),
      variants,
      options,
      weight:0,
      weight_unit:'oz',
      owner
    }
    console.log('createData', createData);
    let postCreated = await Post.create(createData)

    console.log('postCreated', postCreated);
    return postCreated
  },

};
