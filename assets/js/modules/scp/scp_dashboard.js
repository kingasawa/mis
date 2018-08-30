$(function() {
  var start = moment().subtract(29, 'days');
  var end = moment();


  function cb(start, end) {
    if($('#reportrange').length === 0){
      return;
    }
    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));

    let from = `${start.format('MM/DD/YYYY')}`
    let to = `${end.format('MM/DD/YYYY')}`
    // console.log('dashboard-range', query);
    $('.order-report-content').html('loading...');

    socket.get( '/scp/order_dashboard', { from, to }, function( data ) {
      // console.log('order_dashboard data', data);
      $('#order-report-table').html('');
      $('#order-report-total').html(data.total);
      Object.keys(data).map((key) => {
        if(key!== 'total'){
          $('#order-report-table').append(`
              <div class="col-sm-3">
                <p>${key}</p>
                <h3>${data[key]}</h3>
              </div>
           `);
        }
        // $('#order-report-table').append(`<div>${key}: ${data[key]}</div>`);
      })
    } )
  }

  $('#reportrange').daterangepicker({
    ranges: {
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    },
    showCustomRangeLabel: true,
    locale: {
      format: 'MM/DD/YYYY'
    }
  }, cb);

  cb(start, end);
});
