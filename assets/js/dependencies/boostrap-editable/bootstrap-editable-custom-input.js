(function ($) {
  "use strict";

  var CustomInput = function (options) {
    this.init('stock', options, CustomInput.defaults);
  };

  //inherit from Abstract input
  $.fn.editableutils.inherit(CustomInput, $.fn.editabletypes.abstractinput);

  $.extend(CustomInput.prototype, {
    /**
     Renders input from tpl
     @method render()
     **/
    render: function() {
      this.$input = this.$tpl.find('input');
    },

    /**
     Default method to show value in element. Can be overwritten by display option.

     @method value2html(value, element)
     **/
    value2html: function(value, element) {
      console.log('value', value);
      console.log('element', element);
      if(!value) {
        $(element).empty();
        return;
      }
      var html = $('<div>').text(value.stock).html();
      $(element).html(html);
    },

    /**
     Gets value from element's html

     @method html2value(html)
     **/
    html2value: function(html) {
      console.log('html2val', html);
      console.log('html2val', html !== '');
      console.log('====');
      if(html !== ''){
        return { stock: html }
      }
      /*
       you may write parsing method to get value by element's html
       e.g. "Moscow, st. Lenina, bld. 15" => {city: "Moscow", street: "Lenina", building: "15"}
       but for complex structures it's not recommended.
       Better set value directly via javascript, e.g.
       editable({
       value: {
       city: "Moscow",
       street: "Lenina",
       building: "15"
       }
       });
       */
      return null;
    },

    /**
     Converts value to string.
     It is used in internal comparing (not for sending to server).

     @method value2str(value)
     **/
    value2str: function(value) {
      var str = '';
      if(value) {
        for(var k in value) {
          str = str + k + ':' + value[k] + ';';
        }
      }
      return str;
    },

    /*
     Converts string to value. Used for reading value from 'data-value' attribute.

     @method str2value(str)
     */
    str2value: function(str) {
      /*
       this is mainly for parsing value defined in data-value attribute.
       If you will always set value by javascript, no need to overwrite it
       */
      return str;
    },

    /**
     Sets value of input.

     @method value2input(value)
     @param {mixed} value
     **/
    value2input: function(value) {
      if(!value) {
        return;
      }
      this.$input.filter('[name="stock"]').val(value.stock);
      this.$input.filter('[name="all_color"]').val(value.all_color);
      this.$input.filter('[name="all_size"]').val(value.all_size);
    },

    /**
     Returns value of input.

     @method input2value()
     **/
    input2value: function() {


      var data = {
        stock: this.$input.filter('[name="stock"]').val()
      };

      var all_color = this.$input.filter('[name="all_color"]').is(':checked')
      var all_size = this.$input.filter('[name="all_size"]').is(':checked')
      // console.log('teo', teo);
      // if(){
        // all_color: this.$input.filter('[name="all_color"]').val(),
        //   all_size: this.$input.filter('[name="all_size"]').val(),
      // }

      if(all_color){
        data.all_color = 1
      }

      if(all_size){
        data.all_size = 1
      }
      return data;
    },

    /**
     Activates input: sets focus on the first field.

     @method activate()
     **/
    activate: function() {
      this.$input.filter('[name="stock"]').focus();
    },

    /**
     Attaches handler to submit form in case of 'showbuttons=false' mode

     @method autosubmit()
     **/
    autosubmit: function() {
      this.$input.keydown(function (e) {
        if (e.which === 13) {
          $(this).closest('form').submit();
        }
      });
    }
  });

  CustomInput.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
    tpl: '<div class="editable-custom"><label><span>Stock: </span><input type="text" name="stock" class="input-small"></label></div>'+
         '<div class="editable-custom"><label><span>All Color: </span><input type="checkbox" name="all_color" class="input-small" value="1"></label></div>'+
         '<div class="editable-custom"><label><span>All Size: </span><input type="checkbox" name="all_size" class="input-small" value="1"></label></div>',

    inputclass: ''
  });

  $.fn.editabletypes.stock = CustomInput;

}(window.jQuery));
