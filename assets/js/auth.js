$(function() {
  /* LOGIN FORM */
  $('#login-form-submit').submit(function (e) {
    e.preventDefault();
    let data = $(this).serializeObject();
    $('#login-form-submit button').html(`<i class="fa fa-spin fa-spinner"></i> SIGNING...`)
    socket.post('/auth/local',data, function(result){
      // console.log('/auth/local', result);
      let { error, location, user } = result;

      // Authenticated
      if(user && location) {
        window.location = location;
      }

      // Show errors
      if(Array.isArray(error) && error.length > 0) {
        $('#login-form-submit button').html(`SIGN IN`)
        error.map(item => noty({ text: item, type: 'error' }));
      }
    });
  });

  /* ADD USER FORM */
  $('#add-user-submit').submit(function (e) {
    $('button.add-user').html('<i class="fa fa-spin fa-spinner"></i> Adding...')
    e.preventDefault();
    let data = $(this).serializeObject();
    if(data.password !== data.confirm_password){
      swal({text:`Password doesnt match`,icon:'error'});
      $('button.add-user').html('Add new')
      setTimeout(function(){
        $(`input[name=confirm_password]`).css('border-color','#cccccc')
      }, 5000);
      $(`input[name=confirm_password]`).css('border-color','#F44336');
      return false
    }
    socket.post('/user/register',data, function(result){
      $('button.add-user').html('Add user')
      let { error, user } = result;
      console.log('register result', result);

      if(user) {
        window.location = `/acp/user`;
      }

      if(error){

        swal({text:`${error}`,icon:'error'});
        // return noty({
        //   text: error,
        //   type: 'error',
        // });
      }
    });
  });


  /* EDIT USER FORM */
  $('#edit-user-submit').submit(function (e) {
    $('button.add-user').html('<i class="fa fa-spin fa-spinner"></i> Updating...')
    e.preventDefault();
    let data = $(this).serializeObject();
    if(data.password !== data.confirm_password){
      swal({text:`Password doesnt match`,icon:'error'});
      $('button.add-user').html('Update');
      setTimeout(function(){
        $(`input[name=confirm_password]`).css('border-color','#cccccc')
      }, 5000);
      $(`input[name=confirm_password]`).css('border-color','#F44336');
      return false
    }
    socket.post('/user/update',data, function(result){
      $('button.add-user').html('Update')
      let { error, success } = result;
      console.log('update result', result);

      if(error){

        swal({text:`${error}`,icon:'error'});
        // return noty({
        //   text: error,
        //   type: 'error',
        // });
      } else {
        swal({text:`Updated successfull`,icon:'success'});
      }
    });
  });


  /* REGISTER FORM */
  $('#register-form-submit').submit(function (e) {
    e.preventDefault();
    let data = $(this).serializeObject();
    socket.post('/user/register',data, function(result){
      let { error, location, user } = result;
      console.log('register result', result);

      if(user && location) {
        window.location = location;
      }

      if(error){
        return noty({
          text: error,
          type: 'error',
        });
      }
    });
  });

  /* DELETE USER */
  $('a.delete-user').click(function(){
    let id = $(this).data('id');
    let name = $(this).data('name');
    console.log('data', {id,name});
    $(this).html(`<i class="fa fa-spin fa-spinner"></i>`);
    $(`tr#user-${id}`).css('background','#f443363d');
    socket.get(`/user/delete?id=${id}`,function(result){
      $(this).html(`<i class="fa fa-trash-o"></i>`);
      $(`tr#user-${id}`).css('background','#fff');
      if(result.error) {
        noty({
          text: `Cannot delete user <b>${name}</b>` ,
          type: 'error',
        });
      } else {
        $(`tr#user-${id}`).fadeOut();
        noty({
          text: `Deleted user <b>${name}</b> successfull` ,
          type: 'success',
        });
      }
    })
  })




})
