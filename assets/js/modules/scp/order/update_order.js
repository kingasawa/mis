$(function(){
  let pageAllow = ['/scp/order'];
  if(pageAllow.includes(window.location.pathname) == false) return false;
  let currentStyle;
  let currentColor;
  let currentSize;
  let updatePrice;

  $('body').on('click','.updateOrderItem',function(){
    let item = $(this).parents('div.orderItem').find('span.item-title').text();
    currentStyle = $(this).parents('div.orderItem').find('span.item-style').text();
    currentColor = $(this).parents('div.orderItem').find('span.item-color').text();
    currentSize = $(this).parents('div.orderItem').find('span.item-size').text();
    let sku = $(this).parents('div.orderItem').find('span.item-sku').text();

    $('select.edit-mockup-style').html(`<option disabled selected>${currentStyle}</option>`)
    $('select.edit-mockup-color').html(`<option>Loading...</option>`)
    $('select.edit-mockup-size').html(`<option>Loading...</option>`)

    $('span.current_item').text(item);
    $('span.change_item_sku').text(sku);

    let getData = {
      sku
    };

    socket.get('/updateorder/getProductData',getData , function(result){
      console.log(result);

      $('span.item-material-id').text(result.id);

      _.each(result.color[0].color,function(color){
        let option;
        if(color.name == currentColor) {
          option = `<option value="${color.name}" selected>${color.name}</option>`
        } else {
          option = `<option value="${color.name}">${color.name}</option>`
        }
        $('select.edit-mockup-color').append(`${option}`);
      });

      _.each(result.size[0].size,function(size){
        let option;
        updatePrice = size.price;
        if(size.size == currentSize) {
          option = `<option value="${size.size}" data-text="${size.price}" selected>${size.size}</option>`
        } else {
          option = `<option value="${size.size}" data-text="${size.price}">${size.size}</option>`
        }
        $('select.edit-mockup-size').append(`${option}`);
      })

    });

  });


  $('select.edit-mockup-size').change(function(){
    let selected = $(this).find('option:selected');
    updatePrice = selected.data('text');
  }).change();

  $('select.edit-mockup-color').change(function(){
    let selected = $('select.edit-mockup-size option:selected');
    updatePrice = selected.data('text');
  }).change();

  $('#editItemForm').on('submit',function(e){
    e.preventDefault();
    $('#editItemModal').modal('hide');

    let postData = {
      orderId : $('span.orderID').text(),
      sku: $('span.change_item_sku').text(),
    }
    // console.log('begin check current color & size');

    let selectColor = $('#editItemForm select.edit-mockup-color').val();
    let selectSize = $('#editItemForm select.edit-mockup-size').val();



    if(selectColor == currentColor && selectSize == currentSize){
      console.log('nothing change');
    }


    else {
      postData.item = {
        id: $('span.item-material-id').text(),
        style: currentStyle,
        color: selectColor,
        size: selectSize,
        price: updatePrice
      };
      // console.log('postData',postData);
      socket.post('/updateorder/edit',postData,function(result){
        if(result.msg == 'ok') location.reload();
      })
    }



  })

})
