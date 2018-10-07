import axios from 'axios';
const apiKey = 'hu5rpk7mstvzqxnmmeu495x6'

module.exports = {

  getItem: async (id) => {
    let itemData = {}
    let url =`http://api.walmartlabs.com/v1/items/${id}?apiKey=${apiKey}&format=json`
    let getVariants =`http://api.walmartlabs.com/v1/items?ids=518575401,189453116,435647969,579723256,712118804,912412386,323151929&apiKey=${apiKey}&format=json`
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
  }

};
