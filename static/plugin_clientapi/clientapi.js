/*
    plugin_clientapi: web2py simple JS client
    Copyright (C) 2013 Alan Etkin <spametki@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* API definition */

var w2pClientAPI = new Object({
"setupCallback": null, "submitCallback": null, "errorCallback": null,
"queryCallback": null, "newFormCallback": null, "restoreForm": null,
"newRequest": null, "setup": null, "query": null, "newForm": null,
"submit": null, "onSubmit": null, "onSetup": null, "onNewForm": null,
"onQuery": null, "onError": null, "locked": false, "url": null,
"dbName": null, "dbNames": null, "dbSchemes": null, "rows": null,
"queryUrl": null, "form": null, "formUrl": null, "setupUrl": null,
"user": null, "onUser": null, "profile": null, "userCallback": null,
"userUrl": null, "getCallbacks": null, "cors": null});

/* Default callbacks */

w2pClientAPI.setupCallback = function(data){
  w2pClientAPI.dbNames = data.dbnames;
  w2pClientAPI.dbSchemes = data.schemes;}

w2pClientAPI.submitCallback = function(data){
  w2pClientAPI.form = data.form;
  w2pClientAPI.restoreForm();
  w2pClientAPI.locked = false;}

w2pClientAPI.errorCallback = function(error){
  // response object error attributes: .status and .statusText
  // attributes: error.status, error.statusText
  var errorText = "w2pClientAPI error " + error.status;
  errorText += ": " + error.statusText;
  try{
    console.log(errorText);}
  catch(e){
    window.alert(errorText);}
}

w2pClientAPI.queryCallback = function(data){
  w2pClientAPI.rows = data.rows;}

w2pClientAPI.newFormCallback =  function(data){
  w2pClientAPI.form = data.form;
  w2pClientAPI.restoreForm();}

w2pClientAPI.userCallback = function(data){
  w2pClientAPI.profile = data.profile;}

/* API methods */

w2pClientAPI.restoreForm = function(){
  jQuery.each(this.form.latest, function(i, val){
    w2pClientAPI.form.vars[i] = val;});}

w2pClientAPI.getCallbacks = function(action, success, error){
  var defaultCallbackName = action + "Callback";
  var customCallbackName = "on" + action.slice(0, 1).toUpperCase();
  customCallbackName += action.slice(1);
  var defaultCallback = this[defaultCallbackName];
  var customCallback = this[customCallbackName];
  var result = {"success": null, "error": null};

  if(success){
    result.success = function(data){defaultCallback(data);
                                    success(data);}
  }
  else if(customCallback){
    result.success = function(data){defaultCallback(data);
                                    customCallback(data);}
  }
  else{
    result.success = defaultCallback;}

  if(error){
    result.error = error;
  }
  else if(w2pClientAPI.onError){
    result.error = w2pClientAPI.onError;
  }
  else{
    result.error = w2pClientAPI.errorCallback;
  }
  return result;
}

w2pClientAPI.newRequest = function(){
  this.request = new Object();
  this.request.vars = new Object();
  this.request.args = new Array();}

w2pClientAPI.user = function(a, d, s, e){
  // action: one of login/logout/register
  // data: {"username": "gumby@example.com", "password": "1234"}
  // (action, data, success, error)
  /*
  Signature:
  (a)
  (a, d)
  (a, s)
  (a, d, s)
  (a, s, e)
  (a, d, s, e)
  */

  var action = a;
  var data = d;
  var success = s;
  var error = e;

  if (typeof d=="function"){
    data = {};
    success = d;
    error = s;}

  if (!data || typeof data == "function"){
    data = {};
  }

  var callbacks = this.getCallbacks("user", success, error);

  jQuery.post(this.userUrl + "/name/" + action, data,
              callbacks.success).fail(callbacks.error);}

w2pClientAPI.setup = function(u, d, s, e){
  // url, dbName, success, error
  /*
  Signatures:
  ()
  (u)
  (u, d)
  (u, s)
  (u, d, s)
  (u, s, e)
  (u, d, s, e)
  */

  var url = u;
  var dbName = d;
  var success = s;
  var error = e;

  if (typeof u == "undefined"){
    url = this.url;
    dbName = this.dbName;}
  else if(typeof u == "function"){
    url = this.url;
    dbName = this.dbname;
    success = u;
    error = d;}
  else if (typeof d == "function"){
    success = d;
    error = s;
    dbName = undefined;
  }

  if (!this.protocol){
    this.protocol = null;
    if (typeof this.url == "string"){
      if (this.url.indexOf(".") > -1){
        this.protocol = this.url.split(".").pop();}
    }
  }

  var callbacks = this.getCallbacks("setup", success, error);

  if (typeof jQuery == "undefined"){
    callbacks.error(
      {"status": null,
       "statusText": "Could not find jQuery"});
    return;
  }
  else{
    if (this.cors){
      jQuery.ajaxSetup({xhrFields: {withCredentials: true}});
    }
  }

  if (dbName){this.dbName = dbName;}
  if (url){this.url = url;}
  if (!this.url){
    callbacks.error({"status": null,
                     "statusText": "w2pClientAPI.setup: No url"});
    return;}

  this.setupUrl = this.url + "/db/" + this.dbName;
  this.setupUrl += "/action/" + "setup";
  this.userUrl = this.url + "/db/" + this.dbName + "/action/user";

  if (this.profile){
    // If the user is logged in, load server data.
    jQuery.post(this.setupUrl,
                callbacks.success).fail(callbacks.error);
  }
  else {
    callbacks.success(
      {"message": "No user profile found."});
  }
}

w2pClientAPI.query = function(d, q, s, e){
  // (dbName, qobj, success, error)
  /*
  Signatures:
  (q)
  (d, q)
  (q, s)
  (d, q, s)
  (q, s, e)
  (d, q, s, e)
  */

  var dbName = this.dbName;
  var qobj = q;
  var success = s;
  var error = e;

  if (!(typeof d == "object")||(d == null)){
    dbName = d;}
  else{
    qobj = d;
    success = q;
    error = s;}

  var callbacks = this.getCallbacks("query", success, error);
  if (!dbName){dbName = this.dbName;}
  this.newRequest();
  this.queryUrl = this.url + "/db/" + dbName + "/action/" + "query";

  try{
      this.request.vars.query = JSON.stringify(qobj);
      this.request.vars._serialized = JSON.stringify(["query"]);
     }
  catch(e){
    callbacks.error({"status": null,
                     "statusText": "No JSON serializer available"});
    return;}
  jQuery.post(this.queryUrl,
              this.request.vars,
              callbacks.success).fail(callbacks.error);}

w2pClientAPI.newForm = function(d, t, r, s, e){
  // (dbname, table, record, success, error)
  /*
  Signatures:
  (t)
  (d, t)
  (t, r)
  (d, t, r)
  (t, r, s)
  (d, t, r, s)
  (t, r, s, e)
  (d, t, r, s, e)
  */

  var dbName = this.dbName;
  var table = t;
  var record = r;
  var success = s;
  var error = e;

  if (((typeof d=="string")||(d==null))&&(typeof t=="string")&&(
        typeof r=="string")){
    dbName = d;}
  else if (((typeof d=="string")||(d==null))&&(typeof t=="string")){
    // table, record
    if (!isNaN(Number(t))){
      table = d;
      record = t;}
    else{
      // database, table
      dbName = d;
      table = t;}
  }
  else{
    table = d;
    success = t;
    error = r;}

  var callbacks = this.getCallbacks("newForm", success, error);  
  if (!dbName){var dbName = this.dbName;}
  this.formUrl = this.url + "/db/" + dbName;
  this.formUrl += "/action/" + "form" + "/table/" + table;
  if (record){this.formUrl += "/record/" + record;}
  jQuery.post(this.formUrl,
              callbacks.success).fail(callbacks.error);}

w2pClientAPI.submit = function(success, error){
  var callbacks = this.getCallbacks("submit", success, error);
  // do we have a form object?
  if (this.locked || !this.form){
    newError = new Object();
    newError.status = null;
    if (this.locked){
      newError.statusText = "Submission is locked by another form.";}
    else{
      newError.statusText = "Tried to submit but no form found.";}
    callbacks.error(newError);
    return;}
  this.locked = true;
  this.newRequest();

  // required for passing validation
  this.request.vars["_formkey"] = this.form.formkey;
  this.request.vars["_formname"] = this.form.formname;

  // catch incompatible record deletion values
  if (this.form.record_id && this.form.id_field_name){
    this.form.vars[this.form.id_field_name] = this.form.record_id;
  }

  var _serialized = new Array();
  jQuery.each(this.form.vars, function(i, val){
    var newVal = null;
    if ((i == "delete_this_record") && (!val)){
      newVal = "";}
    else{newVal = val;}
    if (typeof newVal == "object"){
      // TODO: support xml serialization
      newVal = JSON.stringify(newVal);
      _serialized.push(i);
    }
    w2pClientAPI.request.vars[i] = newVal;
  });
  w2pClientAPI.request.vars._serialized = JSON.stringify(_serialized);
  
  jQuery.post(this.formUrl, this.request.vars,
              callbacks.success).fail(
                function(error){this.locked = false;
                                callbacks.error(error)});}

