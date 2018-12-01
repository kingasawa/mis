$(function(){

  let orderLength = parseInt($('.order-length span').text());
  let validSubTotal = 0;
  let validOrder = 0;
  let failOrder = 0;
  let validShippingTotal = 0;
  let orderCount = 0;
  let errorNumber = 0;

  if(getParam('sid')){
    $('.validate-data').attr('disabled',false)
    // console.log('co sid');
  }
  function validateData(){
    $('.display-noty .alert').fadeOut();
    $('.display-noty .alert').remove();
    failOrder = 0;
    validSubTotal = 0;
    errorNumber = 0;
    let sid = getParam('sid');
    console.log('on click validate function',failOrder);
    socket.get('/order/getDataCsv',{sid});
  }

  $('.validate-data').click(function(){
    $(this).find('i').removeClass('fa-close fa-check');
    $(this).find('i').addClass('fa-spin');
    validateData();
  });

  $('input[type=file]').change(function () {
    $('.import-csv-submit').attr('disabled',false);
    $('.validate-data').attr('disabled',true);
  });

  $('.import-orders').click(function(){
    let sid = getParam('sid');
    $('a.import-orders i').addClass('fa-spin');
    socket.get(`/order/import_orders?sid=${sid}`,function(data){
    })
  })

  // $('a.export-orders').click(function(){
  //   $(this).attr('disabled',true)
  //   $('a.export-orders i').addClass('fa-spin');
  //   console.log('abc');
  //   $.get('/order/export',function(result){
  //     $('a.export-orders').attr('disabled',true)
  //   });
  // })

})
