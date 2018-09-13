
$(function() {

  if(['/scp/order','/acp/order'].includes(window.location.pathname) === false) return false;
  let orderTable;
  let acpOrderTable;
  // let orderTableShopFilter;
  let acpOrderTableShopFilter;
  // let scpOrderTableShopFilter;
  let orderTableUserFilter;
  let orderTableStatusFilter;
  let acpOrderTableUserFilter;
  // let SELECTED_USER = '';
  // let SELECTED_SHOP = '';
  // let SELECTED_FROM_DATE = '';
  // let SELECTED_TO_DATE = '';
  // let ACP_ORDER_TABLE_DATA = '';
  // let SCP_ORDER_TABLE_DATA = '';
  let IN_ACP = true;
  let ACP_SORT_BY = 'desc';
  if(location.pathname == '/scp/order'){
    IN_ACP = false
  }
  console.log('IN_ACP', IN_ACP);


  // function updateOrderStats(){
  //   let owner = SELECTED_USER;
  //   let shop = SELECTED_SHOP;
  //
  //   let urlStats = '/scp/scp_order_stats';
  //   if(IN_ACP){
  //     urlStats = '/acp/order_stats'
  //   }
  //
  //   socket.get(urlStats,{  owner, shop, from: SELECTED_FROM_DATE, to: SELECTED_TO_DATE }, function(orders) {
  //     $('#status-filter span').text(0);
  //     Object.keys(orders).map(function(order){
  //
  //       //        orders[order]
  //       $('#'+order+ ' span').text(orders[order]);
  //       // console.log('order', order, orders[order]);
  //
  //     })
  //   })
  // }


  $('a.zoom-in').on('click',function(){
    let variantImg = $(this).find('img.variant-image').attr('src');
    $('#zoomImageModal img').attr('src',variantImg);
  });


  $.fn.dataTable.Buttons.defaults.dom.button.className = 'btn btn-default';

  acpOrderTableShopFilter = $('#order-shop-filter');
  acpOrderTableShopFilter.on('change',function(){
    let shopName = $(this).val();
    // console.log('shopName', shopName);
    shopName = shopName.replace('.myshopify.com','');
    acpOrderTable.columns( 5 ).search( shopName ).draw();
    console.log('shopName', shopName);
  })

  acpOrderTableUserFilter = $('#user-filter');
  acpOrderTableUserFilter.on('change',function(){
    let userName = $(this).val();
    acpOrderTable.columns( 16 ).search( userName ).draw();
    console.log('userName', userName);
  })

  orderTableStatusFilter = $('.status-filter a')
  orderTableStatusFilter.on('click',function(){
    let statusName = $(this).data('status')
    orderTableStatusFilter.removeClass('active');
    $(this).addClass('active')
    console.log(statusName);

    if(statusName == 'new'){
      $('a.picklist').removeClass('hidden')
    } else {
      $('a.picklist').addClass('hidden')
    }

    acpOrderTable.columns( 15 ).search( statusName ).draw();
    orderTable.columns( 13 ).search( statusName ).draw();

  })

  orderTable = $('#order-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,

    "processing": true,
    // stateSave: true,
    "columnDefs": [
      {
        "targets": [ 0 ],
        "orderable": false
        // "searchable": true
      },
      {
        "targets": [  ],
        "width": "180px",
      },
      {
        "targets": [ 6 ],
        "width": "100px",
      },
      {
        "targets": [ 7,8 ],
        "width": "450px",
      },
      {
        "targets": [ 0,1,3,5,6,13 ],
        "width": "5px",
      },

    ],

    "order":  [[ 2, ACP_SORT_BY ]] , //desc ID

    lengthMenu: [
      [25, 50, 100,200, -1], ['25 rows', '50 rows','100 rows','200 rows', 'All' ]
    ],
    dom: 'Bfrtip',

    buttons: ['pageLength']
  });

  acpOrderTable = $('#acp-order-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    "processing": true,
    // "stateSave": true,
    "columnDefs": [
      {
        "targets": [ 0 ],
        "orderable": false,
        // "searchable": true
      },
      {
        "targets": [ 0,1,3,4,6 ],
        "width": "5px",
      },
      {
        "targets": [ 8,9 ],
        "width": "500px",
      },

      {
        "targets": [ 10 ],
        "width": "180px",
      },
      {
        "targets": [ 14 ],
        "width": "50px",
      },
      {
        "targets": [ 5,11,13 ],
        "width": "100px",
      },
    ],
    "order":  [[ 2, ACP_SORT_BY ]] , //desc ID
    lengthMenu: [
      [50, 100 , 200, 500], ['50 rows', '100 rows', '200 rows', '500 rows' ]
    ],
    dom: 'Bfrtip',

    buttons: ['pageLength']
  });

  $('select#sort-by').on('change',function(){
    let sortBy = $(this).val();
    ACP_SORT_BY = sortBy;
    acpOrderTable.order([ 2, sortBy ]).draw();
    orderTable.order([ 2, sortBy ]).draw();
  })

  // orderTable.on( 'draw', function () {
  //   updateOrderStats();
  // } );

  //pick all order
  $('input.choose-all-order').on('click',function(){
    if(this.checked) {
      console.log('select all')

      $('input.choose-order-id:checkbox').each(function(){
        $(this).parents('tr.tr-order').addClass('order-picked');
        this.checked = true
      })
    } else {
      console.log('select none')

      $('input.choose-order-id:checkbox').each(function(){
        $(this).parents('tr.tr-order').removeClass('order-picked');
        this.checked = false
      })
    }
    let countChecked = $('input.choose-order-id:checked').length;
    console.log('countChecked', countChecked);
    $('button.count-pickup span.update-val').text(countChecked);
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow')}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  //pick up - 1 order
  $('body').on('click','input.choose-order-id',function(){
    let checked = parseInt($('button.count-pickup span.update-val').text());
    if (this.checked) {
      $('button.count-pickup span.update-val').text(checked+1)
      $(this).parents('tr.tr-order').addClass('order-picked');
    } else {
      $(this).parents('tr.tr-order').removeClass('order-picked');
      $('button.count-pickup span.update-val').text(checked-1)
    }
    let countChecked = $('input.choose-order-id:checked').length;
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow');}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  //pick all item
  $('input.choose-all-item').on('click',function(){
    if(this.checked) {
      console.log('select all')

      $('input.choose-item-id:checkbox').each(function(){
        $(this).parents('tr.tr-item').addClass('item-picked');
        this.checked = true
      })
    } else {
      console.log('select none')

      $('input.choose-item-id:checkbox').each(function(){
        $(this).parents('tr.tr-item').removeClass('item-picked');
        this.checked = false
      })
    }
    let countChecked = $('input.choose-item-id:checked').length;
    console.log('countChecked', countChecked);
    $('div.notification-tracking-item strong').text(countChecked)
  });

  //pick up - 1 item
  $('body').on('click','input.choose-item-id',function(){
    let checked = parseInt($('div.notification-tracking-item strong').text());
    if (this.checked) {
      $('div.notification-tracking-item strong').text(checked+1)
      $(this).parents('tr.tr-item').addClass('item-picked');
    } else {
      $(this).parents('tr.tr-item').removeClass('item-picked');
      $('div.notification-tracking-item strong').text(checked-1)
    }
    let countChecked = $('input.choose-item-id:checked').length;
    if(countChecked < 1) {

    }
  });

  $(document).ready(function(){
    let countItem = $('table tbody tr').length;
    console.log('countItem', countItem);
    $('div.notification-tracking-item strong').text(countItem)
  })
  //end

  $('#order-page a.picklist').click(function(){
    $(this).html(`<i class="fa fa-spin fa-spinner"></i> Please wait....`);
    let checkOwner = $(this).data('owner');
    let checkGroup = $(this).data('group');
    if($(this).data('text') == 'pickup-order'){
      let selectedOrders = $('tr.order-picked').map(function() {
        let checkStatus = $(this).find('td.order-status span').text();
        if(checkStatus == 'New'){
          return $(this).find('input.choose-order-id').data('order-id');
        }
      }).get();
      let picker = $(this).data('picker')
      socket.post('/order/pickup',{picker,selectedOrders},function(data){
        if(data.err) {
          $(this).html(`<i class="fa fa-hand-o-up"></i> Pickup order`);
          swal({
            text: `Got issue! ${data.err}`,
            icon: "error",
            dangerMode: false,
            button: false
          })
          return false;
        }
        location.reload();
      })
    } else if ($(this).data('text') == 'unpick-order'){
      let selectedOrders = $('tr.order-picked').map(function() {
        let checkStatus = $(this).find('td.order-status span').text();
        let checkPicker = $(this).find('td.order-picker span').text();

        if(checkGroup !== 3 || (checkGroup == 3 && checkPicker == checkOwner)){
          return $(this).find('input.choose-order-id').data('order-id');
        }
      }).get();


      socket.post('/order/unpick',{selectedOrders},function(data){
        if(data.err) {
          $(this).html(`<i class="fa fa-close"></i> Unpick order`);
          swal({
            text: `Got issue! ${data.err}`,
            icon: "error",
            dangerMode: false,
            button: false
          })
          return false;
        }
        location.reload();
      })
    } else if ($(this).data('text') == 'change-status'){
      let selectedOrders = $('tr.order-picked').map(function() {
        return $(this).find('input.choose-order-id').data('order-id');
      }).get();

      $(this).html(`<i class="fa fa-refresh"></i> Change status`);
      $('button.changeStatusButton').click(function(){
        $(this).html(`<i class="fa fa-spin fa-spinner"></i> Change status`);
        let status = $('#changeStatusModal select').val();
        console.log('selectedOrders', selectedOrders);
        console.log('status', status);
        socket.post('/order/change_status',{selectedOrders,status},function(data){
          if(data.err) {
            $(this).html(`Change status`);
            swal({
              text: `Got issue! ${data.err}`,
              icon: "error",
              dangerMode: false,
              button: false
            })
            return false;
          }
          location.reload();
        })
      })

    } else if ($(this).data('text') == 'change-user'){
      let selectedOrders = $('tr.order-picked').map(function() {
        return $(this).find('input.choose-order-id').data('order-id');
      }).get();

      $(this).html(`<i class="fa fa-refresh"></i> Change user`);
      $('button.changeStatusButton').click(function(){
        $(this).html(`<i class="fa fa-spin fa-spinner"></i> Change user`);
        let picker = $('#changeUserModal select').val();
        console.log('selectedOrders', selectedOrders);
        console.log('status', picker);
        socket.post('/order/change_user',{selectedOrders,picker},function(data){
          if(data.err) {
            $(this).html(`Change user`);
            swal({
              text: `Got issue! ${data.err}`,
              icon: "error",
              dangerMode: false,
              button: false
            })
            return false;
          }
          location.reload();
        })
      })

    }

  })


  $('#order-table tbody').on('click', 'tr', function () {
    let data = orderTable.row( this ).data();
  });

  $( document ).ready(function() {
    $('input[name=country]').val($('select[name=country_code] option:selected').text())
  });

  $('select[name=country_code]').on('change',function(){
    $('input[name=country]').val($(this).find('option:selected').text())
  });

  $('form#editShippingAddress').on('submit',function(e){
    e.preventDefault();
    $('input.updateInfobutton').val('Updating ...')
    let editAddressData = $(this).serializeObject();
    console.log(editAddressData);
    socket.post('/shopify/update_address',editAddressData,function(data){
      if(data.result == 'true' ){
        location.reload()
      } else {
        $('input.updateInfobutton').val('Apply changes')
        alert(data.msg)
      }
    });
  });

  $('form#editEmailAddress').on('submit',function(e){
    e.preventDefault();
    $('input.updateInfobutton').val('Updating ...')
    let editEmailData = $(this).serializeObject();
    console.log(editEmailData);
    socket.post('/shopify/update_email',editEmailData,function(data){
      if(data.result == 'false'){
        $('input.updateInfobutton').val('Aplly changes')
        $('div.updateInfoNotify').html('<strong>Failed!</strong> '+data.msg)
        $('div.updateInfoNotify').removeClass('hide').addClass('in')
      } else {
        location.reload();
      }
    });
  });

  $('form#updateTrackingInformation').on('submit',function(e){
    e.preventDefault();
    $('input.updateInfobutton').val('Updating ...')
    let updateData = $(this).serializeObject();

    if(updateData.current_number == updateData.trackingNumber && updateData.current_company == updateData.trackingCompany){
      $('#updateTrackingModal').modal('hide');
      $('input.updateInfobutton').val('Update Tracking')
      return false;
    }
    console.log(updateData);
    socket.post('/order/update_tracking',updateData,function(data){
      console.log('da', data);
    });
  });

  $('button.mark-cancelled').click(function(){
    // let  = $(this).data('status');
    let orderId = $(this).data('id');
    console.log('orderId', orderId);

    swal({
      // className: 'remove-store-confirm',
      title: "Are you sure?",
      text: `Once changed, this order's status will change to Cancelled!`,
      icon: "warning",
      dangerMode: false,
      button: {
        text: "Confirm",
        closeModal: false,
      },
    })
      .then((willChange) => {
        if (willChange) {
          socket.post(`/order/mark_cancelled?orderid=${orderId}`,function(data){
            location.reload();
          })
        } else {
          swal.stopLoading();
          swal.close();
        }
      });
  })
  //pickup order & export to excel


  $('.remove-tag').click(function(){
    // console.log('.pickup-orders');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
    socket.get(`/acp/remove_tag`,selectedOrders,function(){
      location.reload();
    });

  })


  // var start = moment('01/01/2017');
  // var end = moment();


  // function cb(start, end) {
  //   if($('#orderreportrange').length === 0){
  //     return;
  //   }
  //   $('#orderreportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  //
  //   let from = start.format('MM/DD/YYYY')
  //   let to = end.format('MM/DD/YYYY')
  //
  //   SELECTED_FROM_DATE = from;
  //   SELECTED_TO_DATE = to;
  //   console.log('from', from);
  //   console.log('to', to);
  //   // console.log('dashboard-range', query);
  //   $('.order-report-content').html('loading...');
  //
  //   orderTable.ajax.reload(null, false);
  //
  //   let postURL = '/scp/scp_order_stats';
  //   if(IN_ACP){
  //     acpOrderTable.ajax.reload(null, false);
  //     // console.log('IN ACP TRUE');
  //     postURL = '/acp/order_stats'
  //   }
  //   socket.get( postURL, { from, to }, function( data ) {
  //     console.log(postURL, data);
  //   } )
  // }

//   $('#orderreportrange').daterangepicker({
//     minDate: '01/01/2017',
//     maxDate: moment().format('MM/DD/YYYY'),
// //      autoApply: true,
// //      "dateLimit": {
// //        "months": 12
// //      },
// //      showDropdowns: true,
// //      timePicker: true,
// //      ranges: {
// //        'Today': [moment(), moment()],
// //        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
// //        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
// //        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
// //        'This Month': [moment().startOf('month'), moment().endOf('month')],
// //        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
// //      },
// //      showCustomRangeLabel: true,
//     locale: {
//       format: 'MM/DD/YYYY'
//     }
//   }, cb);

  // cb(start, end);

  // $('#export-order-csv').click(function(){
  //   // console.log('export csv');
  //   let downloadOrderCsvParams = $.param( SCP_ORDER_TABLE_DATA, false );
  //   // console.log('downloadOrderCsvParams', downloadOrderCsvParams);
  //   // URI('/acp/order_datatable').addQuery(downloadOrderCsvUrl).build().toString()
  //   window.location = `/scp/order_datatable?${downloadOrderCsvParams}`;
  // })

  $('#product-stock').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },

    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      params.product = $(this).data('product');
      params.variant = $(this).data('variant');
      params.shop = $(this).data('shop');
      console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Product stock has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'text',
    pk: 1,
    mode: 'inline',
    showbuttons: false,
    tpl: "<input type='text' style='width: 100px'>",
    url: '/order/update',
    title: 'Enter new stock'
  });

  $('#internal-notes1').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      // console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Note has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'textarea',
    pk: 1,
    // mode: 'inline',
    url: '/order/update',
    title: 'Enter note'
  });

  $('#internal-notes2').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      // console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Note has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'textarea',
    pk: 1,
    // mode: 'inline',
    url: '/order/update',
    title: 'Enter note'
  });

  $('#internal-notes3').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      // console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Note has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'textarea',
    pk: 1,
    // mode: 'inline',
    url: '/order/update',
    title: 'Enter note'
  });

  $('#tag').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      // console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Tags has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'text',
    pk: 1,
    mode: 'inline',
    url: '/order/update',
    title: 'Enter tags'
  });

  $('body').on('click','.mark-cs',function(){
    let id = $(this).data('id');

    let putData = {
      id:id,
      status: 'CS'
    }

    $(this).html(`<i class="fa fa-spin fa-spinner"></i> Updating...`)
    socket.put(`/order/update_status`,putData,function(data){
      location.reload();
    })
  })

  function reloadOrderStatus(){
    $('span.update-status').removeClass('hidden');
    $('select#update-order-status').addClass('hidden')
  }

  $('body').on('click','.order-status',function(){
    reloadOrderStatus();
    $(this).find('span.update-status').addClass('hidden');
    $(this).find('select#update-order-status').removeClass('hidden')
  })

  $('body').on('change','select#update-order-status',function(){
    let orderid = $(this).data('order-id');
    let updateStatus = $(this).val();
    reloadOrderStatus();
    $(this).parents('.order-status').find('span.update-status')
           .html(`<i class="fa fa-spin fa-spinner"></i> Updating...`);
    let putData = {
      id:orderid,
      status: updateStatus
    }

    socket.put(`/order/update_status`,putData,function(data){
      $(`#order-id-${orderid} span.update-status`).text(data[0].status);
    })

    if(updateStatus == 'Refunded'){
      socket.put(`/order/refund?id=${orderid}`,function(createRefund){
        console.log('refunded successful');
      })
    }
  })

  function reloadOrderPicker(){
    $('span.update-picker').removeClass('hidden');
    $('select#update-order-picker').addClass('hidden')
  }

  $('td.update-picker').click(function(){
    reloadOrderPicker();
    let findPicker = $(this).find('span.update-picker').text();
    console.log('findPicker', findPicker);
    if(findPicker.length > 0){
      $(this).find('span').addClass('hidden');
      $(this).find('select#update-order-picker').removeClass('hidden')
    }
  })

  $('select#update-order-picker').on('change',function(){
    let orderid = $(this).data('order-id');
    let updatePicker = $(this).val();
    console.log('updatePicker', updatePicker);
    reloadOrderPicker();
    $(this).parents('td.order-picker').find('span')
           .html(`<i class="fa fa-spin fa-spinner"></i> Updating...`);
    let putData = {
      id:orderid,
      picker: updatePicker
    }
    socket.put(`/order/update_picker`,putData,function(data){
      $(`#order-id-${orderid} span.update-picker`).text(data[0].picker);
    })
  })

  // function reloadOrderNote(id){
  //   console.log('id', id);
  //   $(`tr#order-id-${id} td.order-note span`).removeClass('hidden');
  //   $(`tr#order-id-${id} td.order-note div.update-order-note`).addClass('hidden');
  //   $(this).removeClass('updating-note').addClass('order-note')
  //
  // }

  $('body').on('click','td.order-note',function(){
    console.log('click td');
    let findNote = $(this).find('span.update-note').text();
      $(this).find('span.update-note').addClass('hidden');
      $(this).find('div.update-order-note').removeClass('hidden')
      $(this).addClass('updating-note').removeClass('order-note')
  })

  $('body').on('click','button.cancel-update-note',function(){
    console.log('click td-update');
    $(this).parents('td').find('span.update-note').removeClass('hidden');
    $(this).parents('td').find('div.update-order-note').addClass('hidden')
    $(this).parents('td').addClass('order-note').removeClass('updating-note')
  })

    $('body').on('click','button.save-update-note',function(){
    let orderid = $(this).data('order-id');
    $(this).html('<i class="fa fa-spin fa-spinner"></i>')
    let updateNote = $(`tr#order-id-${orderid} textarea`).val();

    socket.post('/order/update_note',{orderid,updateNote},function(data){
      $(`tr#order-id-${orderid} button.save-update-note`).html('<i class="fa fa-save"></i>')
      console.log('data', data);
      if(!data.err){
        $(`tr#order-id-${orderid} td span.update-note`).text(data[0].internal_notes1)
      }
      $(`tr#order-id-${orderid} td span.update-note`).removeClass('hidden');
      $(`tr#order-id-${orderid} td div.update-order-note`).addClass('hidden')
      $(`tr#order-id-${orderid} td.updating-note`).addClass('order-note').removeClass('updating-note')
    })


  })

  //button mark shipped
  $('button.mark-shipped').click(function(){
    let checked = parseInt($('div.notification-tracking-item strong').text());
    let orderid = $(this).data('id');
    let trackingNumber = $('input[name=tracking-number]').val();
    let trackingCompany = $('select[name=tracking-company]').val();
    let items = [];
    let products = [];
    if(checked < 1){
      noty({
        text: `<b>Error!</b> 
        <div>You must select at least 1 item to shipped!</div>`,
        type: 'error',
      });
      return false;
    }

    $('#order-view-page table tbody tr.item-picked').each(function(){
      let id = $(this).find('td.itemId').text();
      let quantity = $(this).find('td.product-quantity').text();
      let productid = $(this).find('td.productId').text();
      let productName = $(this).find('td.product-name').text();
      items.push({id,quantity,name:productName});
      products.push({id:productid,quantity})
    })
    if(trackingNumber.length < 1){
      noty({
        text: `<b>Error!</b> 
        <div>Tracking number can not be blank!</div>`,
        layout: 'topRight',
        type: 'error',
      });
      $('input[name=tracking-number]').focus();
      $('input[name=tracking-number]').css('border-color','#d95546');
      return false;
    }
    $(this).html(`<i class="fa fa-spin fa-spinner"></i> Mark Shipped`)
    socket.post('/order/mark_shipped',{orderid,trackingCompany,trackingNumber,items,products},function(result){
      console.log('result', result);
      if(!result.error){
        location.reload()
      } else {
        $('button.mark-shipped').html(`Mark Shipped`)
        // console.log('result', result.error.base);
        $.each(result.error.base,function(index,value){
          console.log('value', value);
          noty({
            text: `<b>Error!</b> 
            <div>${value}!</div>`,
            type: 'error',
          });
        })
      }
    })
    console.log('orderid', {orderid,trackingCompany,trackingNumber,items});

  })

  //button update tracking
  // $('button.update-tracking').click(function(){
  //   let checked = parseInt($('div.notification-tracking-item strong').text());
  //   let orderid = $(this).data('id');
  //   let trackingNumber = $('input[name=tracking-number]').val();
  //   let trackingCompany = $('select[name=tracking-company]').val();
  //   let items = [];
  //   let products = [];
  //   if(checked < 1){
  //     noty({
  //       text: `<b>Error!</b>
  //       <div>You must select at least 1 item to update tracking!</div>`,
  //       type: 'error',
  //     });
  //     return false;
  //   }
  //
  //   $('#order-view-page table tbody tr.item-picked').each(function(){
  //     let id = $(this).find('td.itemId').text();
  //     let quantity = $(this).find('td.product-quantity').text();
  //     let productid = $(this).find('td.productId').text();
  //     items.push({id,quantity});
  //     products.push({id:productid,quantity})
  //   })
  //   if(trackingNumber.length < 1){
  //     noty({
  //       text: `<b>Error!</b>
  //       <div>Tracking number can not be blank!</div>`,
  //       layout: 'topRight',
  //       type: 'error',
  //     });
  //     $('input[name=tracking-number]').focus();
  //     $('input[name=tracking-number]').css('border-color','#d95546');
  //     return false;
  //   }
  //   $(this).html(`<i class="fa fa-spin fa-spinner"></i> Update Tracking`)
  //   socket.post('/order/update_tracking',{orderid,trackingCompany,trackingNumber,items,products},function(result){
  //     if(!result.error){
  //       location.reload()
  //     } else {
  //       $(this).html(`Update Tracking`)
  //       console.log('result', result.error);
  //     }
  //   })
  //   console.log('orderid', {orderid,trackingCompany,trackingNumber,items});
  //
  // })

  $('input[name=tracking-number]').on('keyup',function(){
    $('input[name=tracking-number]').css('border-color','#8BC34A');
    if($(this).val().length < 1){
      $('input[name=tracking-number]').css('border-color','#d95546');
    }
  });

  $('.dataTables_filter input[type=search]').keypress(function(e) {
    let searchKey = $(this).val();
    if(e.which == 13 && searchKey.match(/^\d+$/) && searchKey.length > 3 && $('#acp-order-table tbody tr td').length > 1) {
      // window.open(`/acp/order?id=${searchKey}`, '_blank');
      location.href = `/acp/order?id=${searchKey}`;
    }
  });


  $('.copyToClipboard').click(function(){
    let content = $(this).data('text');
    console.log('content', content);
    let $temp = $("<input>");
    $("body").append($temp);
    $temp.val(content).select();
    document.execCommand("copy");
    $temp.remove();
    noty({
      text: `Copy shipping information to clipboard`,
      type: 'success',
    });

  })

})

