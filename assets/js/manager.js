$(function() {
  $('body').on('click','a.edit-cat',function(){
    let id = $(this).attr('data-id');
    let oldTitle = $(this).attr('data-title');
    let getTitle = $(this).attr('data-title').split(' > ');
    let titleLength = getTitle.length;
    let title = getTitle[titleLength-1];
    // console.log('test', {getTitle,titleLength,title});
    swal(`Edit category: ${title}`, {
      content: {
        element: "input",
        attributes: {
          defaultValue: title,
        },
      },

    })
      .then((value) => {
      if(value){
        $(`table#category-table tbody tr#cat-${id}`).css('opacity','0.3');
        let putData = {
          action:'edit',
          id,
          name: value
        }
        socket.post(`/acp/category`,putData,function(result){
          setTimeout(function(){
            $(`table#category-table tbody tr`).css('background','#fff')
          }, 5000);

          $(`table#category-table tbody tr#cat-${id}`).css('opacity','1');
          if(result.error){
            swal("ERORR!", result.error, "error");
            $(`table#category-table tbody tr#cat-${result.id}`).css('background','#f443363b');
            return false;
          }
          location.reload();
        })
      }
      });
  });


  $('body').on('click','.delete-cat',function(){
    let id = $(this).attr('data-id');
    let title = $(this).attr('data-title');
    swal({icon: "warning",text:`Do you want to delete ${title}`})
      .then((value) => {
        $(`table#category-table tbody tr#cat-${id}`).css('opacity','0.3');
        socket.post(`/acp/category?action=delete&id=${id}`,function(result){
          if(result.error){
            $(`table#category-table tbody tr#cat-${id}`).css('opacity','1');
            swal("ERORR!", result.error, "error");
            return false;
          }
          location.reload();
          swal({text:`Deleted: ${title}`,icon:'success'});
        })

      });
  });

  $('form#add-cat').submit(function(e){
    $('button.button-add').html('<i class="fa fa-spin fa-spinner"></i> Adding...')

    e.preventDefault();
    let postData = {
      action: 'add',
      name : $('input[name=name]').val(),
      parent : $('input[name=parent]').val()
    }
    socket.post(`/acp/category`,postData,function(result){
// console.log('result', result);
      $('button.button-add').html('Add New Category');
      setTimeout(function(){
        $(`table#category-table tbody tr`).css('background','#fff')
      }, 5000);

      if(result.error){
        swal("ERORR!", result.error, "error");
        $(`table#category-table tbody tr#cat-${result.id}`).css('background','#f443363b');
        return false;
      }

      location.reload();
    })
  });

  $('input[name=parent]').focus(function(){

    if($(this).val().length === 0){
      $('.dropdown-parent').css('display','block')
      $('.dropdown-parent li').removeClass('hidden')
    }
  })
  $('input[name=parent]').focusout(function(){

    if($(this).val().length === 0){
      $('.dropdown-parent').css('display','none')
      $('.dropdown-parent li').addClass('hidden')
    }
  })

  $('input[name=parent]').bind("keyup", function(e) {
    let value = $(this).val();;
    value = value.toLowerCase();
    $('.dropdown-parent li').each(function(){
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
    if($('.dropdown-parent li.show').length > 0){
      $('.dropdown-parent').css('display','block')
    } else {
      $('.dropdown-parent').css('display','none')
    }
  });

  $('.dropdown-parent li a').click(function(){
    let chooseParent = $(this).text();
    $('input[name=parent]').val(chooseParent);
    $('.dropdown-parent').css('display','none')

    console.log('chooseParent', chooseParent);
  })
});
