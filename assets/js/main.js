$(function() {
  //PRODUCT OPTION PAGE




  // $('.selectpicker').selectpicker({
  //   style: 'btn-info',
  //   size: 4
  // });

  $('[data-toggle="popover"]').popover();


  // $('select.selectpicker').on('change', function(){
  //   var selected = $('.selectpicker').val();
  //   console.log(selected);
  // });
  //
  // $('.selectoption').selectpicker({
  //   style: 'btn-primary',
  //   size: 10,
  //   actionsBox:true,
  // });


  if (window.location.pathname.match(/shopify\/product/gi) || window.location.search.match(/p=sample/gi) ) {
    CKEDITOR.replace('richText');
  }

  if (window.location.pathname.match(/product\/add_product/gi) || window.location.pathname.match(/product\/edit_product/gi)) {
    // @TODO input productDescription -> SEO Desc
    if($('#productDescription').length === 1){
      let productDescriptionCKEDITOR =  CKEDITOR.replace('productDescription');
      productDescriptionCKEDITOR.on("instanceReady",function() {
        console.log('productDescription instanceReady');
        // Load sample data
        let defaultProductDesc = $('#default-product-description').html()
        CKEDITOR.instances['productDescription'].setData(defaultProductDesc);
        function syncProductDescriptionWithSEO(){
          let productDescriptionData = CKEDITOR.instances.productDescription.getData();
          let productDescriptionDataStripped = $(productDescriptionData).text();
          // Only for null data
          if($('[name=metafields_global_description_tag]').val() == ""){
            $('[name=metafields_global_description_tag]').val(productDescriptionDataStripped);
          }
          $('[name=body_html]').val(productDescriptionData);
        }
        // need to sync init data to SEO description
        syncProductDescriptionWithSEO();
        // Auto insert SEO
        CKEDITOR.instances['productDescription'].document.on('keyup', function(event) {
          syncProductDescriptionWithSEO();
        });
      });
    }
  }

  $('.editor').each(function(e){
    console.log('Auto replace richtext editor', this.id);
    CKEDITOR.replace(this.id);
  });

  // $(document).ready(function(){
  //   $('.detail-content').fadeIn('slow');
  //   $('.detail-content').css('margin-left','0');
  //
  //   $('#cp2').colorpicker();
  //
  //   $('#cp3').colorpicker();
  //
  //   $('[data-toggle="tooltip"]').tooltip();
  //   // $('#cp2').colorpicker().on('changeColor', function(e) {
  //   //   $('.live-change-color')[0].style.backgroundColor = e.color.toString(
  //   //     'rgba');
  //   // });
  //
  // });


  let url = window.location.pathname;
  let activePage = url.substring(url.lastIndexOf('/')+1);
  $('div#menuSide li a').each(function(){
    let currentPage = this.href.substring(this.href.lastIndexOf('/')+1);

    if (activePage == currentPage) {
      console.log('activePage', activePage);
      console.log('currentPage', currentPage);

      if(activePage == 'order'){
        $('li.dropdown').addClass('active')
      } else {
        $(this).parent().addClass('active');
      }

    }
  });


  $('#filter-by-date a').each(function(){
    let currentUrl = location.search;
    let activeSearch = $(this).attr('href');
    if (currentUrl == activeSearch) {
      $(this).addClass('active');
    }
  });


  //Sync Store Callback
  socket.on('shop/sync',function(data){
    $('#shop-userid-'+data.msg.user).append('<div class="new-shop-sync media"><div class="media-left">' +
      '<img src="../images/shopify.png" class="media-object" style="width:60px"></div>' +
      '<div class="media-body"><h4 class="media-heading">'+data.msg.name+'</h4></div>' +
      '<div class="media-right"><p><a type="button" class="btn btn-primary">Manager</a></p>' +
      '<p><a type="button" class="btn btn-warning">Remove</a></p></div>')
  });


  $('#feedback-form-submit').submit(function(e){
    e.preventDefault();
    let data = $(this).serializeObject();
    socket.post('/demo/feedback',data, function(result){
      swal("Thank you!", "Your feedback has been received, we will contact you shortly!", "success")
        .then(function(){
          window.location = "/"
        })
    })
  });

  //brand manager
  $('form#add-brand').submit(function(e){
    $('button.button-add').html('<i class="fa fa-spin fa-spinner"></i> Adding...')
    let name = $('input[name=name]').val()
    e.preventDefault();
    socket.post(`/acp/brand?action=add&name=${name}`,function(result){

      console.log('result', result);
      $('button.button-add').html('Add New Brand');
      setTimeout(function(){
        $(`table#brand-list tbody tr`).css('background','#fff')
      }, 5000);

      if(result.error){
        swal("ERORR!", result.error, "error");
        $(`table#brand-list tbody tr#brand-${result.id}`).css('background','#f443363b');
        return false;
      }

      $('table#brand-list tbody').append(`<tr style="background:#ffc10733" id="brand-${result.id}"><td></td>
          <td>${result.id}</td><td class="brand-name">${result.name}</td>
          <td><a class="edit-brand" data-id="${result.id}" data-name="${result.name}" href="#"><i style="color:#7fbf00" class="fa fa-pencil-square-o"></i></a></td>
          <td><a class="delete-brand" data-id="${result.id}" data-name="${result.name}" href="#"><i class="fa fa-trash-o"></i></a></td></tr>`);
    })
  });

  $('body').on('click','.delete-brand',function(){
    let id = $(this).attr('data-id');
    let name = $(this).attr('data-name');
    swal({icon: "warning",text:`Do you want to delete ${name}`,dangerMode: true})
      .then((value) => {
      if(value){
        $(`table#brand-list tbody tr#brand-${id}`).css('opacity','0.3');
        socket.post(`/acp/brand?action=delete&id=${id}`,function(){
          $(`table#brand-list tbody tr#brand-${id}`).fadeOut('slow')
          swal({text:`Deleted: ${name}`,icon:'success'});
        })
      } else {
        swal.stopLoading();
        swal.close();
      }


      });
  });

  $('body').on('click','.edit-brand',function(){
    let id = $(this).attr('data-id');
    let name = $(this).attr('data-name');
    swal("Edit brand name", {
      content: {
        element: "input",
        attributes: {
          defaultValue: name,
        },
      },

    })
          .then((value) => {
            if(value){
              $(`table#brand-list tbody tr#brand-${id}`).css('opacity','0.3');
              socket.post(`/acp/brand?action=edit&id=${id}&name=${value}`,function(result){
                setTimeout(function(){
                  $(`table#brand-list tbody tr`).css('background','#fff')
                }, 5000);

                $(`table#brand-list tbody tr#brand-${id}`).css('opacity','1');
                if(result.error){
                  swal("ERORR!", result.error, "error");
                  $(`table#brand-list tbody tr#brand-${result.id}`).css('background','#f443363b');
                  return false;
                }
                $(`table#brand-list tbody tr#brand-${id} td.brand-name`).text(value);
                $(`table#brand-list tbody tr#brand-${id} a`).attr('data-name',value)
                swal({text:`Changed to: ${value}`,icon:'success'});
                $(`table#brand-list tbody tr#brand-${id}`).css('background','#ffc10733');
              })
            }


          });
  });
  //end brand manager

  //merchant manager
  $('form#add-merchant').submit(function(e){
    $('button.button-add').html('<i class="fa fa-spin fa-spinner"></i> Adding...')
    let name = $('input[name=name]').val()
    e.preventDefault();
    socket.post(`/acp/merchant?action=add&name=${name}`,function(result){

      console.log('result', result);
      $('button.button-add').html('Add New Merchant');
      setTimeout(function(){
        $(`table#merchant-list tbody tr`).css('background','#fff')
      }, 5000);

      if(result.error){
        swal("ERORR!", result.error, "error");
        $(`table#merchant-list tbody tr#merchant-${result.id}`).css('background','#f443363b');
        return false;
      }

      $('table#merchant-list tbody').append(`<tr style="background:#ffc10733" id="merchant-${result.id}"><td></td>
          <td>${result.id}</td><td class="merchant-name">${result.name}</td>
          <td><a class="edit-merchant" data-id="${result.id}" data-name="${result.name}" href="#"><i style="color:#7fbf00" class="fa fa-pencil-square-o"></i></a></td>
          <td><a class="delete-merchant" data-id="${result.id}" data-name="${result.name}" href="#"><i class="fa fa-trash-o"></i></a></td></tr>`);
    })
  });

  $('body').on('click','.delete-merchant',function(){
    let id = $(this).attr('data-id');
    let name = $(this).attr('data-name');
    swal({icon: "warning",text:`Do you want to delete ${name}`,dangerMode: true})
      .then((value) => {
      if(value){
        $(`table#merchant-list tbody tr#merchant-${id}`).css('opacity','0.3');
        socket.post(`/acp/merchant?action=delete&id=${id}`,function(){
          $(`table#merchant-list tbody tr#merchant-${id}`).fadeOut('slow')
          swal({text:`Deleted: ${name}`,icon:'success'});
        })
      } else {
        swal.stopLoading();
        swal.close();
      }


      });
  });

  $('body').on('click','.edit-merchant',function(){
    let id = $(this).attr('data-id');
    let name = $(this).attr('data-name');
    swal("Edit merchant name", {
      content: {
        element: "input",
        attributes: {
          defaultValue: name,
        },
      },

    })
      .then((value) => {
      if(value){
        $(`table#merchant-list tbody tr#merchant-${id}`).css('opacity','0.3');
        socket.post(`/acp/merchant?action=edit&id=${id}&name=${value}`,function(result){
          setTimeout(function(){
            $(`table#merchant-list tbody tr`).css('background','#fff')
          }, 5000);

          $(`table#merchant-list tbody tr#merchant-${id}`).css('opacity','1');
          if(result.error){
            swal("ERORR!", result.error, "error");
            $(`table#merchant-list tbody tr#merchant-${result.id}`).css('background','#f443363b');
            return false;
          }
          $(`table#merchant-list tbody tr#merchant-${id} td.merchant-name`).text(value);
          $(`table#merchant-list tbody tr#merchant-${id} a`).attr('data-name',value)
          swal({text:`Changed to: ${value}`,icon:'success'});
          $(`table#merchant-list tbody tr#merchant-${id}`).css('background','#ffc10733');
        })
      }


      });
  });
  //end merchant manager


  //discount manager
  $('form#add-discount').submit(function(e){
    $('button.button-add').html('<i class="fa fa-spin fa-spinner"></i> Adding...')
    let category = $('form#add-discount select[name=category]').val();
    let title = $('form#add-discount input[name=title]').val();
    let code = $('form#add-discount input[name=code]').val();
    let type = $('form#add-discount select[name=type]').val();
    let value = $('form#add-discount input[name=value]').val();
    let start = $('form#add-discount input[name=start]').val();
    let end = $('form#add-discount input[name=end]').val();
    if(category === 'Choose category'){
      $('form#add-discount select[name=category]').focus();
      $('form#add-discount select[name=category]').css('border','1px solid #F44336');
      noty({
        text: `Choose a category to apply this discount`,
        type: 'error',
      });
      $('button.button-add').html('Add New Discount');
      return false;
    }
    if(title.length === 0){
      $('form#add-discount input[name=title]').focus();
      $('form#add-discount input[name=title]').css('border','1px solid #F44336');
      noty({
        text: `Title can not be blank`,
        type: 'error',
      });
      $('button.button-add').html('Add New Discount');
      return false;
    }
    // if(code.length === 0){
    //   $('form#add-discount input[name=code]').focus();
    //   $('form#add-discount input[name=code]').css('border','1px solid #F44336');
    //   noty({
    //     text: `Title can not be blank`,
    //     type: 'error',
    //   });
    //   $('button.button-add').html('Add New Discount');
    //   return false;
    // }
    if(value.length === 0){
      $('form#add-discount input[name=value]').focus();
      $('form#add-discount input[name=value]').css('border','1px solid #F44336');
      noty({
        text: `Value can not be blank`,
        type: 'error',
      });
      $('button.button-add').html('Add New Discount');
      return false;
    }
    // if(start.length === 0){
    //   $('form#add-discount input[name=start]').focus();
    //   $('form#add-discount input[name=start]').css('border','1px solid #F44336');
    //   noty({
    //     text: `Start at can not be blank`,
    //     type: 'error',
    //   });
    //   $('button.button-add').html('Add New Discount');
    //   return false;
    // }
    e.preventDefault();
    let createDiscount = {
      category,title,type,value
    }
    socket.post(`/shopify/add_discount`,createDiscount,function(result){

      console.log('result', result);
      $('button.button-add').html('Add New Discount');
      setTimeout(function(){
        $(`table#discount-list tbody tr`).css('background','#fff')
      }, 5000);

      if(result.error){
        swal("ERORR!", result.error, "error");
        $(`table#discount-list tbody tr#discount-${result.id}`).css('background','#f443363b');
        return false;
      }

      $('table#discount-list tbody').append(`<tr style="background:#ffc10733" id="discount-${result.id}">
          <td>${result.id}</td><td class="discount-title">${result.title}</td>
          <td class="discount-code">${result.code}</td>
          <td class="discount-type">${result.type}</td>
          <td class="discount-value">${result.value}</td>
          <td class="discount-start">${result.start}</td>
          <td class="discount-end">${result.end}</td>
          <td><a class="edit-discount" data-id="${result.id}" data-title="${result.title}" href="#"><i style="color:#7fbf00" class="fa fa-pencil-square-o"></i></a></td>
          <td><a class="delete-discount" data-id="${result.id}" data-title="${result.title}" href="#"><i class="fa fa-trash-o"></i></a></td></tr>`);
    })
  });

  $('body').on('click','.delete-discount',function(){

    let id = $(this).attr('data-id');
    let title = $(this).attr('data-title');
    swal({icon: "warning",text:`Do you want to delete ${title}`,dangerMode: true})
      .then((value) => {
        if (value) {
          $(`table#discount-list tbody tr#discount-${id}`).css('opacity','0.3');
          socket.post(`/shopify/delete_discount?id=${id}`,function(data){
            if(!data.err){
              $(`table#discount-list tbody tr#discount-${id}`).fadeOut('slow')
              swal({text:`Deleted: ${title}`,icon:'success'});
            }

          })
        } else {

          swal.stopLoading();
          swal.close();
        }

      });
  });

  $('body').on('click','.edit-discount',function(){

    let id = $(this).attr('data-id');
    let title = $(this).attr('data-title');
    let code = $(`tr#discount-${id} td.discount-code`).text();
    let type = $(`tr#discount-${id} td.discount-type`).text();
    let value = $(`tr#discount-${id} td.discount-value`).text();
    let start = $(`tr#discount-${id} td.discount-start`).text()
    let end = $(`tr#discount-${id} td.discount-end`).text();
    console.log('data', {id,title,value,start,end});

    $('form#edit-discount input[name=id]').val(id);
    $('form#edit-discount input[name=code]').val(code);
    $('form#edit-discount input[name=title]').val(title);
    $('form#edit-discount select[name=type]').val(type)
    $('form#edit-discount input[name=value]').val(value)
    $('form#edit-discount input[name=start]').val(start)
    $('form#edit-discount input[name=end]').val(end)
    $('button.save-discount').attr('data-id',id)
    $('#updateDiscountModal').modal()

  });

  $('form#edit-discount').submit(function(e){
    $('.button-update').html('<i class="fa fa-spin fa-spinner"></i> Updating...')
    e.preventDefault();
    let putData = $(this).serializeObject();
    console.log('putData', putData);
      socket.post(`/shopify/edit_discount`,putData,function(data){
        console.log('data', data);
        setTimeout(function(){
          $(`table#discount-list tbody tr`).css('background','#fff')
        }, 5000);
        if(!data.err){
          $(`tr#discount-${putData.id} td.discount-title`).text(putData.title);
          $(`tr#discount-${putData.id} td.discount-code`).text(putData.code);
          $(`tr#discount-${putData.id} td.discount-type`).text(putData.type);
          $(`tr#discount-${putData.id} td.discount-value`).text(putData.value);
          $(`tr#discount-${putData.id} td.discount-start`).text(putData.start);
          $(`tr#discount-${putData.id} td.discount-end`).text(putData.end);
          noty({
            text: `Updated successful`,
            type: 'success',
          });
          $('#updateDiscountModal').modal('hide')
          $(`table#discount-list tbody tr#discount-${putData.id}`).css('background','#cddc3942');
        }
        $('.button-update').html('Update')

      })
  });
  // $('body').on('click','button.save-discount',function(){
  //   let putData = {
  //     id: $(this).data('id'),
  //     title: $('input[name=title]').val(),
  //     value: $('input[name=value]').val(),
  //     start: $('input[name=start]').val(),
  //     end: $('input[name=end]').val()
  //   };
  //   console.log('putData', putData);
  //   socket.post(`/shopify/edit_discount`,putData,function(data){
  //     console.log('data', data);
  //   })
  // })
  //end discount manager

  $('body').on('click','.delete-store',function(){
    let id = $(this).attr('data-id');
    let shop = $(this).attr('data-name');
    swal({icon: "warning",text:`Do you want to delete ${shop}`,dangerMode: true})
      .then((value) => {
        if(value){
          $(`table#store-table tbody tr#store-${id}`).css('opacity','0.3');
          socket.post(`/shopify/delete_store?id=${id}&shop=${shop}`,function(){
            $(`table#store-table tbody tr#store-${id}`).fadeOut('slow')
            noty({
              text: `Delete ${shop} successfull`,
              type: 'success',
            });
          })
        } else {
          swal.stopLoading();
          swal.close();
        }


      });
  });



});
