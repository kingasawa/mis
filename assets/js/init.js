const socket = io.socket;

console.log('Starting to join notification channel');
// Subscribe automatic on sid & userid if loggedin
function connectSocket() {
  socket.get('/notification/join', (data) => {
    console.log('/notification/join', data);
  });
}

function resizeFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  let ratio = Math.min(maxWidth/srcWidth, maxHeight/srcHeight);
  return {
    width: srcWidth*ratio,
    height: srcHeight*ratio
  };
}

function tryResizeFit(width, height, maxWidth, maxHeight) {
  // var maxWidth = 100; // Max width for the image
  // var maxHeight = 100;    // Max height for the image
  var ratio = 0;  // Used for aspect ratio
  // var width = $(this).width();    // Current image width
  // var height = $(this).height();  // Current image height

  // Check if the current width is larger than the max
  // if(width > maxWidth){
  //   ratio = maxWidth / width;   // get ratio for scaling image
  //   height = height * ratio;    // Reset height to match scaled image
  //   width = width * ratio;    // Reset width to match scaled image
  // }
  //
  // // Check if current height is larger than max
  // if(height > maxHeight){
  //   ratio = maxHeight / height; // get ratio for scaling image
  //   width = width * ratio;    // Reset width to match scaled image
  // }

  width = width/20;
  height = height/20;
  return {
    width,
    height
  };
}
// LZW-compress a string

function compress(s) {

  var dict = {};
  var data = (s + "").split("");
  var out = [];
  var currChar;
  var phrase = data[0];
  var code = 256;
  for (var i=1; i<data.length; i++) {
    currChar=data[i];
    if (dict[phrase + currChar] != null) {
      phrase += currChar;
    }
    else {
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      dict[phrase + currChar] = code;
      code++;
      phrase=currChar;
    }
  }
  out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
  for (var i=0; i<out.length; i++) {
    out[i] = String.fromCharCode(out[i]);
  }
  return out.join("");
}

// Decompress an LZW-encoded string
function decompress(s) {
  var dict = {};
  var data = (s + "").split("");
  var currChar = data[0];
  var oldPhrase = currChar;
  var out = [currChar];
  var code = 256;
  var phrase;
  for (var i=1; i<data.length; i++) {
    var currCode = data[i].charCodeAt(0);
    if (currCode < 256) {
      phrase = data[i];
    }
    else {
      phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict[code] = oldPhrase + currChar;
    code++;
    oldPhrase = phrase;
  }
  return out.join("");
}

function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

connectSocket()
socket.on('reconnect', () => {
  console.log('socket reconnect');
  connectSocket();
});

function noty(data) {
  let options = {
    type: 'warning',
    layout: 'topRight', //top
    theme: 'mint',// bootstrap-v3
    text: 'msg',
    timeout: 3000,
    // progressBar: true,
    closeWith: ['click', 'button'],
    animation: {
      open: 'noty_effects_open',
      close: 'noty_effects_close'
    },
    id: false,
    force: false,
    killer: false,
    queue: 'global',
    container: false,
    buttons: [],
    // sounds: {
    //   sources: [],
    //   volume: 1,
    //   conditions: []
    // },
    // titleCount: {
    //   conditions: []
    // },
    modal: false
  };

  options.text = data.text;
  if(data.type)
    options.type = data.type;
  if(data.layout)
    options.layout = data.layout;
  new Noty(options).show();
}

function block() {
  $.blockUI({
    message: '<h1><img src="/images/loader.gif" /></h1>',
    baseZ: 1041,
    timeout: 5000 });
}
function unblock() {
  $.unblockUI();
}
// $.noty.defaults = {
//   layout: 'top',
//   theme: 'mint', // or relax
//   type: 'alert', // success, error, warning, information, notification
//   text: '', // [string|html] can be HTML or STRING
//
//   dismissQueue: true, // [boolean] If you want to use queue feature set this true
//   force: false, // [boolean] adds notification to the beginning of queue when set to true
//   maxVisible: 5, // [integer] you can set max visible notification count for dismissQueue true option,
//
//   template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
//
//   timeout: 5000, // [integer|boolean] delay for closing event in milliseconds. Set false for sticky notifications
//   progressBar: false, // [boolean] - displays a progress bar
//
//   animation: {
//     open: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceInLeft'
//     close: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceOutLeft'
//     easing: 'swing',
//     speed: 500 // opening & closing animation speed
//   },
//   closeWith: ['click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications
//
//   modal: false, // [boolean] if true adds an overlay
//   killer: false, // [boolean] if true closes all notifications and shows itself
//
//   callback: {
//     onShow: function() {},
//     afterShow: function() {},
//     onClose: function() {},
//     afterClose: function() {},
//     onCloseClick: function() {},
//   },
//
//   buttons: false // [boolean|array] an array of buttons, for creating confirmation dialogs.
// };

moment.locale('en');

$.fn.editable.defaults.mode = 'inline';
