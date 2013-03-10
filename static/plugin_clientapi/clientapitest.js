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

var w2pClientAPITest = new Object({
"record": null,
"oldForm": null,
"tests": {"setup": false, "query": false,
     "insert": false, "double": false, "update": false,
     "delete": false},
"query": {"second": 0,
          "first": {"fieldname": "id",
                    "tablename": "plugin_clientapi_log"},
                    "op": "GT"},
"test": null, "testQuery": null, "testInsert": null,
"testDouble": null, "testUpdate": null, "testDelete": null});

w2pClientAPITest.test = function(){
  console.log("Start of w2pClientAPITestSetup");
  w2pClientAPI.setup(w2pClientAPI.url, function(data){
    console.log("returned setup data");
    console.log("dbNames");
    console.log(JSON.stringify(w2pClientAPI.dbNames));
    console.log("Schemes");
    console.log(JSON.stringify(w2pClientAPI.dbSchemes));
    console.log("End of Schemes");
    console.log("Setting callbacks");
    w2pClientAPI.onSubmit = function(data){
      console.log("w2pClientAPI: form processed");
      console.log("errors:");
      console.log(JSON.stringify(w2pClientAPI.form.errors));
    }
    w2pClientAPI.onError = function(error){
      console.log("w2pClientAPI: " + error.statusText);}
    w2pClientAPI.onQuery = function(data){
      console.log(data.rows.length + " rows returned");}
    console.log("End of w2pClientAPITestSetup");
    w2pClientAPITest.testQuery();
  });
  w2pClientAPITest.tests["setup"] = true;
}

w2pClientAPITest.testQuery = function(){
  if (w2pClientAPITest.tests["query"]){return;}
  console.log("Start of w2pClientAPITestQuery");
  w2pClientAPI.onError = function(error){
    console.log("Query test error");
    console.log(JSON.stringify(error));
    w2pClientAPITest.testInsert();
  }
  w2pClientAPI.query(null, w2pClientAPITest.query, function(){
    console.log("returned query data");
    console.log(JSON.stringify(w2pClientAPI.rows));
    console.log("End of w2pClientAPITestQuery");
    w2pClientAPITest.testInsert();
  });
  w2pClientAPITest.tests["query"] = true;    
}

w2pClientAPITest.testInsert = function(){
  if (w2pClientAPITest.tests["insert"]){return;}
  console.log("Start of w2pClientAPITestInsert");
  w2pClientAPI.onNewForm = function(data){
    console.log("filling form programatically");
    w2pClientAPI.form.vars.vars = {"spam": "alot"};
    w2pClientAPI.form.vars.args = [1, 2, 3, 4];
    // store this form for trying a double submission
    w2pClientAPITest.oldForm = w2pClientAPI.form;
    w2pClientAPI.onSubmit = function(data){
      console.log("Data inserted with vars");
      console.log(JSON.stringify(data.form.vars));
      w2pClientAPITest.record = data.form.vars.id;
      console.log("Form errors");
      console.log(JSON.stringify(w2pClientAPI.form.errors));
      console.log("Form accepted");
      console.log(data.form.accepted);
      console.log("End of w2pClientAPITestInsert");
      w2pClientAPITest.testDouble();
    }
    w2pClientAPI.submit();
  }
  console.log("retrieving a form remotely");
  w2pClientAPI.newForm(null, "plugin_clientapi_log");
  w2pClientAPITest.tests["insert"] = true;
}

  w2pClientAPITest.testDouble = function(){
  if (w2pClientAPITest.tests["double"]){return;}
  console.log("Start of w2pClientAPITestDouble");
  console.log("trying to double submit an old form");
  w2pClientAPI.form = w2pClientAPITest.oldForm;
  w2pClientAPI.form.vars.vars = {"spam": "with spam"};
  w2pClientAPI.onError = function(error){
    console.log("Error: " + error.statusText);}
  w2pClientAPI.onSubmit = function(data){
      console.log("form errors");
      console.log(JSON.stringify(data.form.errors));
      console.log("formkey " + data.form.formkey);
      console.log("accepted " + data.form.accepted);
      console.log("record id " + data.form.record_id);
      console.log("End of w2pClientAPITestDouble");
      w2pClientAPITest.testUpdate();
  }
  w2pClientAPI.submit();
  w2pClientAPITest.tests["double"] = true;
}

w2pClientAPITest.testUpdate = function(){
  if (w2pClientAPITest.tests["update"]){return;}
  console.log("Start of w2pClientAPITestUpdate");
  w2pClientAPI.onNewForm = function(data){
    console.log("updating form programatically");
    w2pClientAPI.form.vars.vars = {"spam": "with spam"};
    w2pClientAPI.form.vars.args = [1, 2, 3, 4]
    w2pClientAPI.onSubmit = function(data){
      console.log("Data updated with vars");
      console.log(JSON.stringify(data.form.vars));
      console.log("Form errors");
      console.log(JSON.stringify(data.form.errors));
      console.log("End of w2pClientAPITestUpdate");
      w2pClientAPITest.testDelete();
    }
    w2pClientAPI.submit();
  }
  console.log("retrieving an update form remotely");
  w2pClientAPI.newForm(null, "plugin_clientapi_log",
                       w2pClientAPITest.record);
  w2pClientAPITest.tests["update"] = true;
}

w2pClientAPITest.testDelete = function(){
  if (w2pClientAPITest.tests["delete"]){return;}
  console.log("Start of w2pClientAPITestDelete");
  w2pClientAPI.onNewForm = function(data){
    console.log("deleting data programatically");
    w2pClientAPI.form.vars.delete_this_record = true;
    w2pClientAPI.onSubmit = function(data){
      console.log("Data deleted with vars");
      console.log(JSON.stringify(data.form.vars));
      console.log("Form errors");
      console.log(JSON.stringify(data.form.errors));
      console.log("End of w2pClientAPITestDelete");
    }
    w2pClientAPI.submit();
  }
  console.log("retrieving a delete form remotely");
  w2pClientAPI.newForm(null, "plugin_clientapi_log",
                       w2pClientAPITest.record);
  w2pClientAPITest.tests["delete"] = true;
  console.log("Complete tests list");
  console.log(JSON.stringify(w2pClientAPITest.tests));
}

