let userTable;
let productStatusFilter;
let productShopFilter;
let productTable;
let scpProductTable;
let productTableFilter;

$(function() {

  productStatusFilter = $('#product-status-filter a')

  let statusName;
  productStatusFilter.on('click',function(){
    productStatusFilter.removeClass('active');
    statusName = $(this).data('status')
    $(this).addClass('active');
    console.log(statusName);
    if(statusName == 'Disabled'){
      $('tr.product-hidden').removeClass('hidden')
    }
    if(statusName === ''){
      console.log('status null');
      $('tr.product-hidden').addClass('hidden')
    }

    if(statusName == 'Out of stock'){
      $('td.postDisabled').parent('tr.tr-product').addClass('hidden')
      productTable.columns( 12 ).search( statusName ).draw();
      return false;
    }
    productTable.columns( 12 ).search( '' ).draw();
    productTable.columns( 11 ).search( statusName ).draw();

  });

  $('#filter-product').on('change',function(){
    let product = $(this).val();
    console.log('product', product);
    if(product=='error'){
      productTable.columns( 4 ).search( product ).draw();
      scpProductTable.columns( 4 ).search( product ).draw();
    }
  })

  let shopName;
  productShopFilter = $('#product-shop-filter');
  productShopFilter.on('change',function(){
    shopName = $(this).val();
    productTable.columns( 2 ).search( shopName ).draw();
    // console.log('shopName', shopName);
  })

  let filterBy=4;
  productTableFilter = $('#product-table-filter');
  productTableFilter.on('change',function(){
    filterBy = $(this).val();
    // productTable.columns( 2 ).search( shopName ).draw();
    console.log('filterBy', filterBy);
    if(filterBy==8){
      $('.slider').css('display','inline-block');
      $('#search-filter input').addClass('hidden')
    } else {
      $('.slider').css('display','none');
      $('#search-filter input').removeClass('hidden')
    }
  })
  $('#search-filter input').on('keyup',function(){
    let keyValue = $(this).val();
    console.log('keyvalue', keyValue);
    productTable.columns( filterBy ).search( keyValue ).draw();
  })

  productTable = $('#acp-product-table').DataTable({
    "bSort" : true,
    // "searching": false,
    "language": datatablesLang,
    // "ajax": "/product/datatable",
    "processing": true,
    // stateSave: true,
    // "serverSide": true,
    "columnDefs": [
      {
        "targets": [ 0,3,9,10,12,13,14 ],
        "orderable": false,
        // "searchable": true
      },
      {
        "targets": [ filterBy ],
        // "orderable": false,
        "searchable": true
      },
      {
        "targets": [ 4 ],
        "width": "500px",
      },
      {
        "targets": [ 3 ],
        "width": "100px",
      },
      {
        "targets": [ 2 ],
        "width": "200px",
      },
    ],

    order:  [[ 1, 'desc' ]] , //desc ID
    // "searchCols": [{}, {}, {}], // match with collums on html
    lengthMenu: [
      [50, 100, 200, 300,400,-1], ['50 rows', '100 rows','200 rows','300 rows','400 rows','All products']
    ],
    dom: 'Bfrtip',
    // dom: '<"top"iflp>rt<"bottom"iflp>',

    buttons: ['pageLength']
  });

  scpProductTable = $('#scp-product-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    // "ajax": "/product/datatable",
    "processing": true,
    // stateSave: true,
    // "serverSide": true,
    "columnDefs": [
      {
        "targets": [ 1,5,6,7,9,10,11 ],
        "orderable": false,
        // "searchable": true
      },
      // {
      //   "targets": [ 4 ],
      //   "width": "500px",
      // },
      // {
      //   "targets": [ 3 ],
      //   "width": "100px",
      // },
      // {
      //   "targets": [ 2 ],
      //   "width": "200px",
      // },
    ],

    order:  [[ 0, 'desc' ]] , //desc ID
    // "searchCols": [{}, {}, {}], // match with collums on html
    lengthMenu: [
      [50, 100, 200, -1], ['50 rows', '100 rows','200 rows','All products']
    ],
    dom: 'Bfrtip',
    buttons: ['pageLength']
  });

  $('[data-toggle="tooltip"]').tooltip();


  //pick all product
  $('input.choose-all-product').on('click',function(){
    if(this.checked) {
      console.log('select all')

      $('input.choose-product-id:checkbox').each(function(){
        $(this).parents('tr.tr-product').addClass('product-picked');
        this.checked = true
      })
    } else {
      console.log('select none')

      $('input.choose-product-id:checkbox').each(function(){
        $(this).parents('tr.tr-product').removeClass('product-picked');
        this.checked = false
      })
    }
    let countChecked = $('input.choose-product-id:checked').length;
    console.log('countChecked', countChecked);
    $('button.count-pickup span.update-val').text(countChecked);
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow')}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  //pick up - 1 product
  $('body').on('click','input.choose-product-id',function(){
    let checked = parseInt($('button.count-pickup span.update-val').text());
    if (this.checked) {
      $('button.count-pickup span.update-val').text(checked+1)
      $(this).parents('tr.tr-product').addClass('product-picked');
    } else {
      $(this).parents('tr.tr-product').removeClass('product-picked');
      $('button.count-pickup span.update-val').text(checked-1)
    }
    let countChecked = $('input.choose-product-id:checked').length;
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow');}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  $('#product-page a.picklist').click(function(){
    let type = $(this).attr('data-text');


    let countPushed;
    let countSync;
    //sync product
    if(type == 'sync_product'){

      countPushed = 0;
      let selectedProducts = $('tr.product-picked').map(function() {
        let checkImg = $(this).find('td.product-image img').attr('src').length;
        let checkGtin = $(this).find('td.product-gtin').text().length;
        let checkStore = $(this).find('td.product-store').text().length;
        if(checkStore === 0 && checkGtin > 0 && checkImg > 0){
          return $(this).find('input.choose-product-id').data('product-id');
        }
      }).get();

      countSync = selectedProducts.length;

      $('#selectStoreModal').modal();
      $('button.push-product-confirm').click(function(){
        if(countSync === 0){
          new Noty({
            type: 'error',
            layout: 'topRight',
            text: `All product sync are not allowed, please remove store, add Gtin and add image`,
            timeout: 3000
          }).show();
          return false;
        }
        let shop = $('#selectStoreModal select[name=shop]').val();
        $(this).attr('disabled');
        $('#selectStoreModal').modal('hide');
        $('div.progress').removeClass('hidden');
        $('div.progress-bar').addClass('progress-bar-success')
        $('div.progress-bar').html(`Push products to ${shop}`)
        socket.get(`/product/sync`,{selectedProducts,shop},function(){});
      })

      //unsync product
    } else if(type == 'unsync_product') {
      countPushed = 0;
      let selectedProducts = $('tr.product-picked').map(function() {
        if($(this).find('td.product-store').text().length > 0){
          return $(this).find('input.choose-product-id').data('product-id');
        }
      }).get();

      countSync = selectedProducts.length;

      if(countSync === 0){
        new Noty({
          type: 'error',
          layout: 'topRight',
          text: `All product are not sync yet with any store`,
          timeout: 3000
        }).show();
        return false;
      }
      $('div.progress').removeClass('hidden');
      $('div.progress-bar').addClass('progress-bar-danger');
      $('div.progress-bar').html(`Remove products from store`)
      socket.get(`/product/unsync`,{selectedProducts},function(){});
    } else if(type == 'restock_product') {
      countPushed = 0;
      let selectedProducts = $('tr.product-picked').map(function() {
        return $(this).find('input.choose-product-id').data('product-id');
      }).get();

      let selectedProductsHasStore = $('tr.product-picked').map(function() {
        if($(this).find('td.product-store').text().length > 0){
          return $(this).find('input.choose-product-id').data('product-id');
        }
      }).get();

      countSync = selectedProductsHasStore.length;

      if(countSync === 0){
        new Noty({
          type: 'error',
          layout: 'topRight',
          text: `error notification`,
          timeout: 3000
        }).show();
        return false;
      }
      $('div.progress').removeClass('hidden');
      $('div.progress-bar').addClass('progress-bar-danger');
      $('div.progress-bar').html(`Remove products from store`)
      socket.get(`/product/restock`,{selectedProducts},function(){});
    }



    socket.on('pushto/shopify',function(data){

      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id}`).css('background','#8bc34a52')
      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id} td.product-store`).text(data.resultPush[0].store)
      countPushed += 1;
      let progressWidth = parseInt((countPushed/countSync)*100)
      $('.progress-bar').attr('style',`width:${progressWidth}%`);
      $('div.progress-bar').html(`<i class="fa fa-spin fa-spinner"></i> Pushing products... ${progressWidth}% (${countPushed}/${countSync})`)
      $('button.push-product-confirm').html(`<i class="fa fa-spin fa-spinner"></i> Pushing... (${countPushed}/${countSync})`);
      if(countSync == countPushed){
        // $('#selectStoreModal').modal('hide');
        // $('button.push-product-confirm').html(`Push`);
        location.reload()
      }
    });

    socket.on('unsync/shopify',function(data){
      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id}`).css('background','#8bc34a52')
      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id} td.product-store`).text('')
      countPushed += 1;
      let progressWidth = parseInt((countPushed/countSync)*100)
      $('.progress-bar').attr('style',`width:${progressWidth}%`);
      $('div.progress-bar').html(`<i class="fa fa-spin fa-spinner"></i> Removing products... ${progressWidth}% (${countPushed}/${countSync})`)
      if(countSync == countPushed){
        // $('#selectStoreModal').modal('hide');
        // $('button.push-product-confirm').html(`Push`);
        location.reload()
      }
    });

    socket.on('restock/shopify',function(data){
      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id}`).css('background','#8bc34a52')
      $(`table#acp-product-table tr#product-id-${data.resultPush[0].id} td.product-store`).text('')
      countPushed += 1;
      let progressWidth = parseInt((countPushed/countSync)*100)
      $('.progress-bar').attr('style',`width:${progressWidth}%`);
      $('div.progress-bar').html(`<i class="fa fa-spin fa-spinner"></i> Restock products... ${progressWidth}% (${countPushed}/${countSync})`)
      if(countSync == countPushed){
        // $('#selectStoreModal').modal('hide');
        // $('button.push-product-confirm').html(`Push`);
        location.reload()
      }
    });

  })

  $('body').on('click','a.search-mpn',function(){
    let id = $(this).data('id');
    let title = $(`tr#product-id-${id} td.product-title`).text();
    let brand = $(`tr#product-id-${id} td.product-brand`).text();
    let mpn = $(`tr#product-id-${id} td.product-mpn`).text();
    let imgSrc = $(`tr#product-id-${id} td.product-image img`).attr('src');

    $('#updateGtinModal .product-details .product-title').text(title);
    $('#updateGtinModal .product-details .product-brand').text(brand);
    $('#updateGtinModal .product-details .product-mpn').text(mpn);
    $('#updateGtinModal .product-details img.product-image').attr('src',imgSrc);
    $('#updateGtinModal').modal();
    $('#search-result').html('<i class="fa fa-spin fa-spinner"></i>')


    socket.get(`/product/get_gtin?id=${id}`,function(data){

      if(data.error){
        $('#search-result').html(data.error);
        return false;
      }

      $('#search-result').html('')
      $.each(data,function(){
        console.log('product_name', this.product_name);
        console.log('images', this.images);
        console.log('images 0', this.images['0']);
        $('#search-result').append(`<div class="media saerch-details">
          <div class="media-left">
            <img src="${this.images['0']}" class="media-object" style="width:80px">
          </div>
          <div class="media-body">
            <h4 class="media-heading product-title">${this.product_name}</h4>
            <p class="product-mpn">${this.mpn}</p>
            <p class="product-brand">${this.brand}</p>
            <p class="product-manufacturer">${this.manufacturer}</p>
            <button type="button" data-id="${id}" data-barcode="${this.barcode}" class="btn btn-info update-barcode">Update GTIN ${this.barcode}</button>
          </div>
        </div>`)
      });
    })
  })

  $('body').on('click','button.update-barcode',function(){
    let id = $(this).data('id');
    let barcode = $(this).data('barcode');
    console.log('data', {id,barcode});
    $(this).html(`<i class="fa fa-spin fa-spinner"></i> Updating GTIN ${barcode}...`)
    socket.post(`/product/update_gtin?id=${id}&barcode=${barcode}`,function(data){
      if(!data.err){
        $('#updateGtinModal').modal('hide');
        setTimeout(function(){
          $(`tr#product-id-${id}`).css('background','#fff');
        },5000)
        $(`tr#product-id-${id} td.product-gtin`).text(barcode);
        $(`tr#product-id-${id}`).css('background','#ffc1073d');
      }
    })
  })

  // Instantiate a slider


});
