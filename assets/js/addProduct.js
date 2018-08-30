$(function() {

  // if(window.location.pathname !== '/scp/add_product' && window.location.pathname !== '/scp/edit_product' && window.location.pathname !== '/scp/product' && window.location.pathname !== '/acp/product' && window.location.pathname !== '/acp/edit_product'){
  //   return false;
  // }

  $('button.add-merchant').click(function(){

  })

  $('.selectoption').selectpicker({
    style: 'btn-info',
  });
  // if(['/scp/order','/acp/order'].includes(window.location.pathname) == false)


  $('#add-merchant').on('changed.bs.select', function (e) {
    $('.merchant-list').html('')
    let merchantArr = $(e.currentTarget).val();

    $.each(merchantArr,function(index,merchant){
      $('.merchant-list').append(`
        <div style="margin-bottom:5px" class="input-group merchant-item">
        <span class="merchant_name input-group-addon">${merchant}</span>
        <input id="merchant_code" type="text" class="form-control" name="merchant_code" placeholder="Enter code">
      </div>`)
    })
  });


  $('input[name=brand]').bind("keyup", function(e) {
    let value = $(this).val();;
    value = value.toLowerCase();
    // console.log('value', value);
    $('.dropdown-brand li').each(function(){
      let aName = $(this).find('a').text();
      aName = aName.toLowerCase();
      // console.log('test', {aName,value});
      if(aName.match(value)){
        // console.log('true');
        $(this).removeClass('hidden').addClass('show')
      } else {
        $(this).addClass('hidden').removeClass('show')
      }
    })
    if($('.dropdown-brand li.show').length > 0){
      $('.dropdown-brand').css('display','block')
    } else {
      $('.dropdown-brand').css('display','none')
    }
  });

  // $('input[name=gtin]').bind("keypress", function(e) {
  //   let value = $(this).val();
  //   console.log('value', value);
  // });

  $('.dropdown-brand li a').click(function(){
    let chooseBrand = $(this).text();
    $('input[name=brand]').val(chooseBrand);
    $('.dropdown-brand').css('display','none')

    console.log('chooseBrand', chooseBrand);
  })


  function createVariant(){
    $('table#createVariant tbody').html('')
    let variantOption = [];

    let price = $('input[name=price]').val();
    let barcode = $('input[name=gtin]').val();
    let sku = $('input[name=sku]').val();
    let optionValueOne = $('input#option-value-1').val();
    let optionValueTwo = $('input#option-value-2').val();
    let optionValueThree = $('input#option-value-3').val();

    if((optionValueOne.length + optionValueTwo.length + optionValueThree.length) > 0) {
      $('.table-variant').removeClass('hidden')
    } else {
      $('.table-variant').addClass('hidden')
    }

    let getValueOne = optionValueOne.split(',');
    let getValueTwo = optionValueTwo.split(',');
    let getValueThree = optionValueThree.split(',');

    $.each(getValueOne,function(index,x){
      $.each(getValueTwo,function(index,y){
        $.each(getValueThree,function(index,z){
          if(x.length>0 && y.length>0 && z.length>0){
            variantOption.push({title:`${x} • ${y} • ${z}`})
          } else if(x.length>0 && y.length===0 && z.length===0) {
            variantOption.push({title:`${x}`})
          } else if(y.length>0 && x.length===0 && z.length===0) {
            variantOption.push({title:`${y}`})
          } else if(z.length>0 && x.length===0 && y.length===0) {
            variantOption.push({title:`${z}`})
          } else if(x.length>0 && y.length>0 && z.length===0) {
            variantOption.push({title:`${x} • ${y}`})
          } else if(x.length>0 && y.length===0 && z.length>0) {
            variantOption.push({title:`${x} • ${z}`})
          } else if(x.length===0 && y.length>0 && z.length>0) {
            variantOption.push({title:`${y} • ${z}`})
          }

        })
      })
    })

    $.each(variantOption,function(index,title){
      $('table#createVariant tbody').append(`<tr>
                  <td class="variant-checked"><input class="option-checked" type="checkbox" checked></td>
                  <td class="variant-title">${title.title}</td>
                  <td class="variant-price"><input type="text" class="form-control" value="${price}"></td>
                  <td class="variant-sku"><input type="text" class="form-control" value="${sku}"></td>
                  <td class="variant-barcode"><input type="text" class="form-control" value="${barcode}"></td>
                </tr>`)
    })
  }
  $(document).ready(function(){
    if (window.location.pathname.match(/product\/edit_product/gi)){
      console.log('url true');
      createVariant();
      if($('table#createVariant tbody tr').length>0){
        $('.variant-option').removeClass('hidden');
        $('.add-variant').addClass('hidden');
        $('.remove-variant').removeClass('hidden');
      }
      if($('.uploaded-images img.img-source').length>0){
        $('.uploaded-images img.img-source').each(function(){
          $('div#uploadImages').append(`<span class="image-success hidden">${$(this).attr('src')}</span>`)
        })
      }
    }
  })

  $('body').on('click','a.delete-image',function(){
    let source = $(this).attr('data-source');
    $(this).parent('div.upload-img').fadeOut('slow')
    $('span.image-success').each(function(){
      let findImg = $(this).text();
      if(source == findImg) {
        $(this).remove();
      }
    })
  })

  $('form#add_product').bind("keypress", function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      return false;
    }
  });

  $('.option-value').on('change',function(){
    createVariant();
  })

  $('input[name=brand]').on('change',function(){
    let value = $(this).val();
    console.log('value', value);
  })

  $('button.createProductButton').on('click',function(){

    if($('input[name=compare_at_price]').val().length === 0){
      let getPrice = $('input[name=price]').val()
      $('input[name=compare_at_price]').val(getPrice)
    }

    let merchantArr = []
    $('.merchant-list .merchant-item').each(function(){
      merchantArr.push({
        name:$(this).find('span.merchant_name').text(),
        code:$(this).find('input[name=merchant_code]').val()
      })
    })
    // console.log(merchantArr)


    let optionNameArr = [];
    $('table#addVariant tbody tr').each(function(){
      if($(this).find('input.option-value').val().length>0){
        optionNameArr.push({name:$(this).find('td.option-name input').val()})
      }
    });

    let postData = {
      "product": {
        "title": $('input[name=title]').val(),
        "product_type": $('input[name=type]').val(),
        "body_html": $('input[name=body_html]').val(),
        // "vendor": $('input[name=vendor]').val(),
        "published": true,
        "tags": $('input[name=tags]').val(),
        "options": optionNameArr,

        // "variants": [],
        // "images": []
      },
      "price": $('input[name=price]').val(),
      "compare_at_price": $('input[name=compare_at_price]').val(),
      "sku": $('input[name=sku]').val(),
      "weight": $('input[name=weight]').val(),
      "weight_unit": $('select[name=weight-unit]').val(),
      "stock": $('input[name=stock]').val(),
      "merchant": merchantArr,
      "option1": $('input[name=option-value-1]').val(),
      "option2": $('input[name=option-value-2]').val(),
      "option3": $('input[name=option-value-3]').val(),
      "global": $('input[name=global]:checked').val(),
      "category": $('select[name=category]').val(),
      "collections": $('input[name=collections]').val(),
      "brand": $('input[name=brand]').val(),
      "mpn": $('input[name=mpn]').val(),
      "gtin": $('input[name=gtin]').val(),
    };

    if(postData.product.title.length === 0){
      $('input[name=title]').focus();
      $('input[name=title]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.product.title.length > 150){
      $('input[name=title]').focus();
      $('input[name=title]').css('border','1px solid #F44336');
      noty({
        text: `Title: max length 150`,
        type: 'error',
      });
      return false;
    }

    if(postData.product.body_html.length === 0){
      $('#cke_productDescription').css('border','1px solid #F44336')
      return false;
    }

    if(postData.price.length === 0 || postData.price.split('.').length > 2){
      $('input[name=price]').focus();
      $('input[name=price]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.stock.length === 0 || postData.stock.split('.').length > 1 || postData.stock < 1){
      $('input[name=stock]').focus();
      $('input[name=stock]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.mpn.length === 0){
      $('input[name=mpn]').focus();
      $('input[name=mpn]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.brand.length === 0){
      $('input[name=brand]').focus();
      $('input[name=brand]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.category === 'Choose category'){
      $('select[name=category]').focus();
      $('select[name=category]').css('border','1px solid #F44336')
      return false;
    }

    if(optionNameArr.length > 0){
      let variantOption = [];
      $('table#createVariant tbody tr').each(function(){
        if($(this).find('td.variant-checked input').is(':checked') === true){
          let eachOption = {
            title: $(this).find('td.variant-title').text(),
            price: $(this).find('td.variant-price input').val(),
            compare_at_price: $('input[name=compare_at_price]').val(),
            sku: $(this).find('td.variant-sku input').val(),
            barcode: $(this).find('td.variant-barcode input').val(),
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            inventory_quantity: $('input[name=stock]').val(),
            weight: $('input[name=weight]').val(),
            weight_unit: $('select[name=weight-unit]').val(),
            option1: $(this).find('td.variant-title').text().split(' • ')[0],
            option2: $(this).find('td.variant-title').text().split(' • ')[1],
            option3: $(this).find('td.variant-title').text().split(' • ')[2]
          }

          if(eachOption.title.split(' • ').length === 1){
            delete eachOption["option2"];
            delete eachOption["option3"];
          } else if(eachOption.title.split(' • ').length === 2){
            delete eachOption["option3"];
          }

          variantOption.push(eachOption)
        }
      });
      postData.product.variants = variantOption;
      // console.log('variantOption', variantOption);
    } else {
      postData.product.variants = [{
        title: $('input[name=title]').val(),
        price: $('input[name=price]').val(),
        compare_at_price: $('input[name=compare_at_price]').val(),
        sku: $('input[name=sku]').val(),
        barcode: $('input[name=gtin]').val(),
        weight: $('input[name=weight]').val(),
        weight_unit: $('select[name=weight-unit]').val(),
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        inventory_quantity: $('input[name=stock]').val()
      }]
    }
    let imageArr = [];
    $('div#uploadImages span.image-success').each(function(){
      // console.log($(this).attr("alt"))
      let img = $(this).text();
      imageArr.push({src:img})
    })

    if(imageArr.length > 0){
      postData.product.images = imageArr;
    }

    $('div.se-pre-con').css('display','block')
    socket.post('/product/add',postData,function(result){
      // $('div.se-pre-con').css('display','none');
      // swal({
      //   text: 'Created successfull',
      //   icon: 'success',
      //   button: false
      // });
      // console.log('result');
      location.reload()
    })
    console.log('postData', postData);
  })

  //edit product
  $('button.saveProductButton').on('click',function(){

    if($('input[name=compare_at_price]').val().length === 0){
      let getPrice = $('input[name=price]').val()
      $('input[name=compare_at_price]').val(getPrice)
    }

    let merchantArr = []
    $('.merchant-list .merchant-item').each(function(){
      merchantArr.push({
        name:$(this).find('span.merchant_name').text(),
        code:$(this).find('input[name=merchant_code]').val()
      })
    })
    // console.log(merchantArr)

    let optionNameArr = [];
    $('table#addVariant tbody tr').each(function(){
      if($(this).find('input.option-value').val().length>0){
        optionNameArr.push({name:$(this).find('td.option-name input').val()})
      }
    });

    let postData = {
      "product": {
        "title": $('input[name=title]').val(),
        "product_type": $('input[name=type]').val(),
        "body_html": $('input[name=body_html]').val(),
        // "vendor": $('input[name=vendor]').val(),
        "published": true,
        "tags": $('input[name=tags]').val(),
        "options": optionNameArr,
        // "variants": [],
        // "images": []
      },
      "id": $('input[name=id]').val(),
      "price": $('input[name=price]').val(),
      "compare_at_price": $('input[name=compare_at_price]').val(),
      "sku": $('input[name=sku]').val(),
      "weight": $('input[name=weight]').val(),
      "stock": $('input[name=stock]').val(),
      "merchant": merchantArr,
      "option1": $('input[name=option-value-1]').val(),
      "option2": $('input[name=option-value-2]').val(),
      "option3": $('input[name=option-value-3]').val(),
      "global": $('input[name=global]:checked').val(),
      "category": $('select[name=category]').val(),
      "collections": $('input[name=collections]').val(),
      "brand": $('input[name=brand]').val(),
      "mpn": $('input[name=mpn]').val(),
      "gtin": $('input[name=gtin]').val(),
    };

    if(postData.product.title.length === 0){
      $('input[name=title]').focus();
      $('input[name=title]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.product.title.length > 150){
      $('input[name=title]').focus();
      $('input[name=title]').css('border','1px solid #F44336');
      noty({
        text: `Title: max length 150`,
        type: 'error',
      });
      return false;
    }

    if(postData.product.body_html.length === 0){
      $('#cke_productDescription').css('border','1px solid #F44336')
      return false;
    }


    if(postData.price.length === 0 || postData.price.split('.').length > 2){
      $('input[name=price]').focus();
      $('input[name=price]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.stock.length === 0 || postData.stock.split('.').length > 1){
      $('input[name=stock]').focus();
      $('input[name=stock]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.mpn.length === 0){
      $('input[name=mpn]').focus();
      $('input[name=mpn]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.brand.length === 0){
      $('input[name=brand]').focus();
      $('input[name=brand]').css('border','1px solid #F44336')
      return false;
    }

    if(postData.category === 'Choose category'){
      $('select[name=category]').focus();
      $('select[name=category]').css('border','1px solid #F44336')
      return false;
    }

    if(optionNameArr.length > 0){
      let variantOption = [];
      $('table#createVariant tbody tr').each(function(){
        if($(this).find('td.variant-checked input').is(':checked') === true){
          let eachOption = {
            title: $(this).find('td.variant-title').text(),
            price: $(this).find('td.variant-price input').val(),
            compare_at_price: $('input[name=compare_at_price]').val(),
            sku: $(this).find('td.variant-sku input').val(),
            barcode: $(this).find('td.variant-barcode input').val(),
            weight: $('input[name=weight]').val(),
            weight_unit: $('select[name=weight-unit]').val(),
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            inventory_quantity: $('input[name=stock]').val(),
            option1: $(this).find('td.variant-title').text().split(' • ')[0],
            option2: $(this).find('td.variant-title').text().split(' • ')[1],
            option3: $(this).find('td.variant-title').text().split(' • ')[2]
          }

          if(eachOption.title.split(' • ').length === 1){
            delete eachOption["option2"];
            delete eachOption["option3"];
          } else if(eachOption.title.split(' • ').length === 2){
            delete eachOption["option3"];
          }

          variantOption.push(eachOption)
        }
      });
      postData.product.variants = variantOption;
      // console.log('variantOption', variantOption);
    } else {
      postData.product.variants = [{
        title: $('input[name=title]').val(),
        price: $('input[name=price]').val(),
        compare_at_price: $('input[name=compare_at_price]').val(),
        sku: $('input[name=sku]').val(),
        barcode: $('input[name=gtin]').val(),
        weight: $('input[name=weight]').val(),
        weight_unit: $('select[name=weight-unit]').val(),
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        inventory_quantity: $('input[name=stock]').val()
      }];
    }
    let imageArr = [];
    $('div#uploadImages span.image-success').each(function(){
      // console.log($(this).attr("alt"))
      let img = $(this).text();
      imageArr.push({src:img})
    })

    postData.product.images = imageArr;

    $('div.se-pre-con').css('display','block')
    socket.post('/product/edit',postData,function(result){
      // console.log('result');
      // $('div.se-pre-con').css('display','none')
      // swal({
      //   text: 'Updated successfull',
      //   icon: 'success',
      //   button: false
      // });
      location.reload()
    })
    console.log('postData', postData);
  })
  //end

  $('a.delete-post').click(function(){
    let checkStatus = $(this).data('status');
    if(checkStatus == 'Sync'){
      swal('Error! This product is sync with Shopify, please unsync this!')
      return false;
    }
    let title = $(this).attr('data-title');
    let id = $(this).attr('data-id')

    swal({
      title: 'Are you sure?',
      text: "You will not be able to recover this product!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        $(`tr#product-id-${id}`).css('opacity','0.3');
        $(`tr#product-id-${id} i.fa-trash-o`).removeClass('fa-trash-o').addClass('fa-spinner fa-spin');
        socket.post(`/product/delete?id=${id}`,function(data){
          console.log('data', data);
          if(data.success){
            swal('Deleted! Your product has been deleted!')
            $(`tr#product-id-${id}`).css('opacity','1');
            $(`tr#product-id-${id} td.postUnsync`).text('Disabled');

          } else {
            $(`tr#product-id-${id}`).css('opacity','1');
            $(`tr#product-id-${id} i.fa-trash-o`).addClass('fa-trash-o').removeClass('fa-spinner fa-spin');
            swal('Error!')
          }
        })
      }
    })
  })

});
