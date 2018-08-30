$(function() {
  if(['/scp/profile'].includes(window.location.pathname) == false) return false;

  $('#password').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value
      console.log('params', params);
      params[params.name] = params.value;
      // params.a = 1;
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your password has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'password',
    pk: 1,
    // url: '/user/update',
    title: 'Enter password'
  });

  let TOKEN_EXISTED = $('#token-box').html() !== '';
  if(TOKEN_EXISTED){
    $('#generate-token').text("Re-Generate New Token");
  }else{
    console.log('no token found');
    $('#generate-token').text("Generate Token");
  }

  $('#generate-token').click(function(e) {
    e.preventDefault();

    let confirmGenerateToken = true;
    if(TOKEN_EXISTED) {

      if (confirm("Are you sure to re-generate new token?") == true) {
        confirmGenerateToken = true;
      }else{
        return false;
      }
    }

    socket.post('/scp/generateToken',{}, function(result){
      let { token } = result;
      $('#token-box').html(token);
    })

  })

  var clipboard = new Clipboard('#copy-api-key');

  // clipboard.on('success', function(e) {
    // console.info('Action:', e.action);
    // console.info('Text:', e.text);
    // console.info('Trigger:', e.trigger);

    // e.clearSelection();
  // });


});
