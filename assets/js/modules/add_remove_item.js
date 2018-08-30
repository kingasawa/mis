$(function() {

  if(['/scp/order'].includes(window.location.pathname) == false) return false;

  $('#addRemoveModal .orderItemRefund').each(function(){
    let basecost = parseFloat($(this).find('span.item-basecost').text());
    let quantity = parseInt($(this).find('input.change-quantity-refund').val());
    let calculateCost = basecost*quantity;

    $(this).find('span.item-total-cost').text(calculateCost);

    $(this).find('input.change-quantity-refund').on('keyup',function(e){
      let newQuantity = $(this).val();
      let newCost = basecost*newQuantity;
      $(this).parents('.orderItemRefund').find('span.item-total-cost').text(newCost);
    })
  });

  $('#addRemoveForm').on('submit',function(e){
    e.preventDefault();
    $('#addRemoveModal').modal('hide');
    $('div.changeQuantityNotify').html(`Please wait...`)
    $('div.changeQuantityNotify').removeClass('hide').addClass('in');

    let lineItem = [];
    $('#addRemoveModal .orderItemRefund').each(function(){
      let sku = $(this).find('span.item-sku').text();
      let quantity = parseInt($(this).find('input.change-quantity-refund').val());
      let title = $(this).find('span.item-title').text();
      lineItem.push({sku,quantity,title})
    })
    // ,
    let postData = {
      orderid: $('input[name=orderid]').val(),
      id: $('span.orderID').text(),
      lineItem
    }
    console.log('data',postData);
    socket.post('/scp/editQuantity',postData,function(result){
      if(result.msg == 'ok') location.reload();
    });

  })



})
