/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
const knex = require('knex')({client: 'pg'});

module.exports = {
  index: async(req,res) => {
    return res.notFound()
  },

  all_user: async(req,res) => {
    let foundUser = await User.find();
    res.json(foundUser)
  },

  list: (req, res) => {
    res.view('user/index');
  },

  datatable: async(req, res) => {
    console.log('sails.config.globals.group.SELLER',sails.config.globals.group.SELLER)
    bluebird.promisifyAll(Order);
    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: 'u.id, u.username, u.email, u.group, u.createdAt, u.payment_method, u.status, u.last_login',
      sCountTableName: `public.user u`,
      sTableName: `public.user u`,
      sWhereAndSql: `"group" <> 1`,
      sGroupBySql: `group by u.id`,
      aSearchColumns: ['u.id', 'u.username','u.email', 'u.status']
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;

    console.log('queries', JSON.stringify(queries, null, 4));
    /** fix "createdAt" search issue **/

      // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Order.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Order.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    // let newSelect = knex.with('userDatatable',knex.raw(queries.select))
    //                     .from('userDatatable')
    // console.log('newSelect', newSelect.toString());

    let select = await (Order.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    res.json(queryBuilder.parseResponse(results));
  },


  register: async(req, res) => {
    const params = req.allParams();
    console.log('params register', params);
    sails.log.debug('user:register', params);
    let result = {};
    const user = await Promise.resolve(User.register(params))
                 .then(user => {
                   result.user = user;
                   result.location = `/login?email=${user.email}`;
                   sails.log.debug('user:register user', user);
                 })
                 .catch(err => {
                   sails.log.error('user:register err', JSON.stringify(err));

                   result.error = JSON.stringify(_.get(err, 'invalidAttributes', {}));
                 });

    if(req.isSocket){
      return res.json(result);
    }
    res.redirect(result.location);
  },

  setting: (req,res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    User.update({id:req.session.user.id},{auto_pay:params.autopay}).exec(()=> {
      sails.sockets.broadcast(session_id,'update/setting')
    })
  },

  address: async(req,res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    let foundUser = await Promise.resolve(BillingAddress.findOne({owner:req.user.id}));
    params.owner = req.user.id;
    if(foundUser) {
      BillingAddress.update({owner:req.user.id},params).exec(()=>{
        sails.sockets.broadcast(session_id,'new/address',{msg:'update'})
      })
    } else {
      BillingAddress.create(params).exec(()=>{
        sails.sockets.broadcast(session_id,'new/address',{msg:'create'})
      })
    }
  },

  update: async (req, res) => {
    if(req.user.group == 3){
      return res.json({error:'You are not allowed'});
    }

    let { password,id,username,email,group,commission } = req.allParams();

    let findUser = await User.findOne({id});
    if(findUser.group == 1 && req.user.group !== 1){

      res.json({error:'You are not allowed'})
      return false;
    }

    console.log('params', { password,id });
    // let id = req.user.id;
    let updateData = {
      id,username,email,group,commission
    }
    if(password){
      updateData.password = password;
    }

    let updatePassword = new Promise((resolve, reject) => {
      return sails.services.passport.protocols.local.update(updateData, (error, result) => {
        let data = {};
        if(error){
          data.error = _.get(error, 'invalidAttributes.password[0].message', {});
        }else{
          data = {
            success: 'updated'
          }
        }

        resolve(data);
      });
    })
    let result = await updatePassword;

    if(result.error){
      return res.negotiate(result.error)
    }
    res.json(result);
  },

  add: async(req,res) => {
    if(!req.user || req.user.group == 3){
      return res.forbidden()
    }
    return res.view('acp/add_user')
  },

  edit: async(req,res) => {
    if(!req.user || req.user.group == 3){
      return res.forbidden()
    }
    let {id} = req.allParams();
    let findUser = await User.findOne({id});
    if(findUser.group == 1 && req.user.group !== 1){
      return res.forbidden();
    }
    console.log('findUser', findUser);
    return res.view('acp/edit_user',{findUser})
  },

  delete: async(req,res) => {
    let {id} = req.allParams();
    if(req.user.group == 3){
      return res.json({error:'You are not allowed'});
    }
    let findUser = await User.findOne({id});
    if(findUser.group == 1 && req.user.group !== 1){
      return res.json({error:'You are not allowed'});
    }

    User.destroy({id}).then((deleteUser)=>{
      Passport.destroy({user:id}).then((deletePassport)=>{
        return res.json({success:id})
      }).catch((error)=>{
        return res.json(error)
      })
    }).catch((error)=>{
      return res.json(error)
    })
  },

};

