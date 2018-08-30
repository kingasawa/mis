let userTable;
let userStatusFilter;

$(function() {


  // function format ( d ) {
  //   // `d` is the original data object for the row
  //   return '<table border="0" class="table-data-info">'+
  //          '<tr>'+
  //          '<td>Full name:</td>'+
  //          '<td>'+d.username+'</td>'+
  //          '</tr>'+
  //          '<tr>'+
  //          '<td>Status:</td>'+
  //          '<td>'+d.status+'</td>'+
  //          '</tr>'+
  //
  //          '</table>';
  // }

  userStatusFilter = $('#status-filter a')

  let statusName;
  userStatusFilter.on('click',function(){
    // console.log($(this).text());
    userStatusFilter.removeClass('active');
    statusName = $(this).data('status')
    $(this).addClass('active');
    // console.log(statusName);
    userTable.columns( 3 ).search( statusName ).draw();

  })

  userTable = $('#user-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    // "ajax": "/user/datatable",
    "processing": true,
    // stateSave: true,
    // "serverSide": true,
    // "columnDefs": [
    //   // {
    //   //   "width": "50px",
    //   //   "targets": 0,
    //   // },
    //   // {
    //   //   "width": "200px",
    //   //   "targets": [1,2],
    //   // },
    //   // {
    //   //   "width": "200px",
    //   //   "targets": 5
    //   // },
    //   // {
    //   //   "width": "100px",
    //   //   "targets": [2, 3, 4, 6]
    //   // },
    //
    // ],
    // "columns": [
    //   // {
    //   //   "className":      'details-control',
    //   //   "orderable":      false,
    //   //   "data":           null,
    //   //   "defaultContent": ''
    //   // },
    //   {
    //     // "className": 'details-control',
    //     "orderable": true,
    //     "searchable": true,
    //     "data": 'id',
    //     "name": 'id',
    //   },
    //   // {
    //   //   "name": "createdAt",
    //   //   "data": "createdAt",
    //   //   "searchable": true,
    //   //   "render":function(data){
    //   //       return moment(data).format('MM/DD/YYYY');
    //   //     }
    //   // },
    //   {
    //     "name": "username",
    //     "data": "username",
    //     "searchable": true,
    //     "render": function(data, type, full, meta){
    //       return `<a href="/user/edit?id=${full.id}" data-toggle="tooltip" title="${full.email}">${data}</a>`
    //     }
    //   },
    //
    //   {
    //     "name": "status",
    //     "data": "status",
    //     "searchable": true,
    //     "render":function(data){
    //       return `<span class="user${data.replace(/\s/g,'').toLowerCase()}">${data}</span>`;
    //     }
    //   },
    //   {
    //     // "className":"logintime",
    //     "name": "last_login",
    //     "data": "last_login",
    //     "searchable": false,
    //     "render":function(data){
    //       if(data){
    //         return moment(data).format('MM/DD/YYYY');
    //       } else {
    //         return data;
    //       }
    //
    //     }
    //   },
    //   // {
    //   //   "name": "payment_method",
    //   //   "data": "payment_method",
    //   //   "searchable": false
    //   // },
    //   // {
    //   //   "name": "total_order",
    //   //   "data": "total_order",
    //   //   "searchable": false
    //   // },
    //   // {
    //   //   "name": "total_amount",
    //   //   "data": "total_amount",
    //   //   "searchable": false
    //   // },
    //   {
    //     // "className": 'details-control',
    //     "orderable": true,
    //     "searchable": true,
    //     "data": 'id',
    //     "name": 'id',
    //     "render":function(data){
    //       return `<a href="/acp/user?action=delete&id=${data}"><i class="fa fa-trash-o"></i></a>`;
    //     }
    //   },
    // ],
    order:  [[ 2, 'asc' ]] , //desc ID
    "searchCols": [{}, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [10, 25, 50], ['10 rows', '25 rows', '50 rows']
    ],
    // dom: 'Bfrtip',
    buttons: ['pageLength']
  });
  // $('#user-table tbody').on('click', 'td.details-control', function () {
  //   let tr = $(this).closest('tr');
  //   let row = userTable.row( tr );
  //
  //   if ( row.child.isShown() ) {
  //     // This row is already open - close it
  //     row.child.hide();
  //     tr.removeClass('shown');
  //   }
  //   else {
  //     // Open this row
  //     row.child( format(row.data()) ).show();
  //     tr.addClass('shown');
  //   }
  // } );

  $('[data-toggle="tooltip"]').tooltip();
});
