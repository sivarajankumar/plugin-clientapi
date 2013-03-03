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

var w2pClientAPI = new Object({
"setupCallback": null, "submitCallback": null, "errorCallback": null,
"queryCallback": null, "newFormCallback": null, "restoreForm": null,
"newRequest": null, "setup": null, "query": null, "newForm": null,
"submit": null, "onSubmit": null, "onSetup": null, "onNewForm": null,
"onQuery": null, "onError": null, "locked": false, "url": null,
"dbName": null, "dbNames": null, "dbSchemes": null, "rows": null,
"queryUrl": null, "form": null, "formUrl": null, "setupUrl": null});

w2pClientAPI.setupCallback = function(data){
  w2pClientAPI.dbNames = data.dbnames;
  w2pClientAPI.dbSchemes = data.schemes;
  if (w2pClientAPI.onSetup){
    w2pClientAPI.onSetup(data);
  }
}
w2pClientAPI.submitCallback = function(data){
  w2pClientAPI.form = data.form;
  w2pClientAPI.restoreForm();
  w2pClientAPI.locked = false;
  if (w2pClientAPI.onSubmit){
    w2pClientAPI.onSubmit(data);}
}

w2pClientAPI.errorCallback = function(error){
  // response object error attributes: .status and .statusText
  // attributes: error.status, error.statusText
  if (w2pClientAPI.onError){w2pClientAPI.onError(error);}
  else {
    var errorText = "w2pClientAPI error " + error.status;
    errorText += ": " + error.statusText;
    try{
      console.log(errorText);}
    catch(e){
      window.alert(errorText);}
  }
}
w2pClientAPI.queryCallback = function(data){
  w2pClientAPI.rows = data.rows;
  if (w2pClientAPI.onQuery){w2pClientAPI.onQuery(data);}
}

w2pClientAPI.newFormCallback =  function(data){
  w2pClientAPI.form = data.form;
  w2pClientAPI.restoreForm();
  if (w2pClientAPI.onNewForm){
    w2pClientAPI.onNewForm(data);}
}

w2pClientAPI.restoreForm = function(){
  jQuery.each(this.form.latest, function(i, val){
    w2pClientAPI.form.vars[i] = val;
  });
}

w2pClientAPI.newRequest = function(){
  this.request = new Object();
  this.request.vars = new Object();
  this.request.args = new Array();
}

w2pClientAPI.setup = function(url, onSetup){
  this.url = url;
  this.setupUrl = this.url + "/db/" + this.dbName;
  this.setupUrl += "/action/" + "setup";
  if (onSetup){
    this.onSetup = onSetup;}
  jQuery.post(this.setupUrl,
              this.setupCallback).fail(this.errorCallback);
}

w2pClientAPI.query = function(dbName, qobj, onQuery){
  if (!dbName){dbName = this.dbName;}
  if (onQuery){this.onQuery = onQuery;}

  this.newRequest();
  this.queryUrl = this.url + "/db/" + dbName + "/action/" + "query";
  try{
      this.request.vars.query = JSON.stringify(qobj);
      this.request.vars._serialized = JSON.stringify(["query"]);
     }
  catch(e){
    this.errorCallback({"status": null,
                        "statusText": "No JSON serializer available"});
    return;}
  jQuery.post(this.queryUrl,
              this.request.vars,
              this.queryCallback).fail(this.errorCallback);
}

w2pClientAPI.newForm = function(dbName, table, record){
  if (!dbName){var dbName = this.dbName;}
  this.formUrl = this.url + "/db/" + dbName;
  this.formUrl += "/action/" + "form" + "/table/" + table;
  if (record){this.formUrl += "/record/" + record;}
  jQuery.post(this.formUrl,
              this.newFormCallback).fail(this.errorCallback);
}

w2pClientAPI.submit = function(){
  // do we have a form object?
  if (this.locked || !this.form){
    newError = new Object();
    newError.status = null;
    if (this.locked){
      newError.statusText = "Submission is locked by another form.";}
    else{
      newError.statusText = "Tried to submit but no form found.";}
    this.errorCallback(newError);
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
              this.submitCallback).fail(
                function(error){w2pClientAPI.locked = false;
                                w2pClientAPI.errorCallback(error);
                                   });
}

