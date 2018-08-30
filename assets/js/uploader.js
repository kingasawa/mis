$(function() {

  if(['/scp/add_product'].includes(window.location.pathname) === false) return false;
  var socket = io.socket;

  let oneCmtoPx = 37.795275590551;
  let printWidth = 14;
  let printHeight = 16;

  let aspect = Math.floor(printWidth*oneCmtoPx) + 'x' + Math.floor(printHeight*oneCmtoPx)
  let minWidth = 1200;
  let minHeight = 1200;

  console.log('Printer frame aspect', aspect);

  function imageValidation(file, done) {
    file.acceptDimensions = (...a) => {
      noty({
        text: `<b>Uploading, please wait...</b> 
        <div>Your design will be chosen automatically</div>`,
        type: 'success',
      });
      done(...a)
    };
    file.rejectDimensions = function() {
      let rejectMsg = `Minimun width and minimun height must be ${minWidth}px at least, please re-upload`;
      noty({
        text: rejectMsg,
        type: 'error',
      });
      done(rejectMsg);
    };
  }

  function imageValidationCb(file) {
    // Do the dimension checks you want to do
    console.log('imageValidationCb file', file, minWidth, minHeight);
    if (file.width < minWidth || file.height < minHeight) {
      file.rejectDimensions()
    }
    else {
      file.acceptDimensions();
    }
  }

  // For test demo uploader
  Dropzone.options.imageUploader = {
    paramName: "image",
    accept: imageValidation,
    init: function () {
      this.on("thumbnail", imageValidationCb);
      this.on("success", function (file, response) {
        //Upload xong lam gi
        console.log('imageUploader',response);
      });
    }
  };

  Dropzone.options.frontImage = {
    paramName: "image",
    maxFiles: 1,
    dictDefaultMessage: 'drop your front images here to upload',
    init: function () {
      this.on("success", function (file, response) {
        console.log(response);
        // $('input[name=front-img]').val(response.fitlUrl);
        $('input[name=front-img-id]').val(response.id)
      });
    }
  };

});
