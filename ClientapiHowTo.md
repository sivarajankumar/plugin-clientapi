# plugin\_clientapi Howto

# plugin\_clientapi Howto #

It is assumed you downloaded the plugin from the project page [download section](http://code.google.com/p/plugin-clientapi/downloads/list) at Google Code and installed it with web2py admin interface. web2py plugins are really easy to install. For help on installing plugins, refer to the [web2py book plugin section](http://www.web2py.com/books/default/chapter/29/12#Plugins)

## Default test ##

Before starting, you might want to check everything is working with the default test at /plugin\_clientapi/test.html. The test is run automatically in the background and you can read the output in your browser's debugging console (for FireFox in a PC hit Ctr+Shift+k)

The plugin adds a plugin\_clientapi\_log table which is used for recording requests. The default test uses this table for crud operations.

For running the test, you need an authenticated app user which is member of the _manager_ group. Else, you have to give the user _read_, _create_ and _update_ rights for the _plugin\_clientapi\_log_ table. For help on adding user rights, refer to the [access control](http://web2py.com/books/default/chapter/29/09) chapter of the web2py book.

## Setup ##

First, we customize the plugin with the plugin manager. None of this options are mandatory and you can simply add the component to a view with defaults

```
# add this to your app model file
from gluon.tools import PluginManager
plugins = PluginManager()

# clientapi options

# requests are logged by default. Here we disable them
plugins.clientapi.settings.log = False

# setup makes the client api download any db scheme
# and set default values. You can call .setup from custom
# JavaScript code.
plugins.clientapi.settings.setup = True

# a string function name for calling after client setup
# this is a convenient shortcut for handling database
# definitions upon retrieval. This can also be set with
# custom JavaScript.
plugins.clientapi.settings.onsetup = None
```

## Placing the component ##

Adding the clientapi to the app is as simple as adding the following call to any page view

```
{{=plugin_clientapi()}}
```

Alternatively, you could create the component in the model or controller
```
clientapi = plugin_clientapi()
```

and then append it to a view in this way
```
{{=clientapi}}
```

If you want application-wide access to clientapi, just add the above function component call to the view layout, so it's loaded on any request. Be careful not to start using the api before calling it's setup method (by setting the setup option to True or else calling it explicitly from a custom script). It needs to initialize default values, i.e. the url for querying the server api action

## Calling clientapi functions client-side ##

Here's a basic example of how the plugin\_clientapi JavaScript interface works. For more complete examples check the default test code at appname/static/plugin\_clientapi/clientapitest.js. You can also look for other howtos and general reference in the project wiki page

plugin\_clientapi defines a global w2pClientAPI JavaScript object. That is the object you'll use in your custom code to interface with the server. Mind that your script should be defined after the component is placed in the view, or the clientapi object will not be available.

We start by linking a custom function to the onSetup clientapi event. This is not needed if you configured the clientapi.settings.onsetup option, but you should link this event to your code somewhere, otherwise your script will not be able to detect when w2pClientAPI is operative. Usually you'll need one .setup call for page load, but you can call it again if you need to update the database schemes

```
w2pClientAPI.onSubmit = function(data){
  // data is the complete server response payload object
  // i.e. data.dbNames is an array with DAL instance names.

  // store the first database name from the server database connections list
  var myDbName = data.dbNames[0];

  // now we get the list of tablenames from that database
  var someTableList = w2pClientAPI.getTableNames(myDbName);

  // get a complete table scheme
  var myTable = w2pClientAPI.getScheme(myDbName, "cheese");

  // get a complete field scheme
  var myField = w2pClientAPI.getScheme(myDbName, "cheese", "runny");

  // this command retrieves the complete requires representation for
  // the walpole_readers_choice field in the cheese table yeolde,
  // including sets of values and options

  var requires = w2pClientAPI.getRequires("db", "yeolde", "walpole_readers_choice");
```

Let's retrieve a form for further submission.

```
// set the callback on form retrieval
w2pClientAPI.onNewForm = function(data){window.alert("Got the new form!");}
// retrieve a create form
w2pClientAPI.newForm("db", "cheese");
```

The form is stored as w2pClientAPI.form (and also passed to the callback). For update forms, you have to add a third id argument to the .newForm call. You can programatically fill the form in this way

```
// name it
w2pClientAPI.form.vars.name = "rochefort";
// add more information (how runny it is)
w2pClientAPI.form.vars.runny = "very";
```

Say you want to add the cheese to the shop list, and test for validation. You simply call w2pClientAPI.submit and then you can read the output with a callback, in case you need to know if it is runny enough

```
// we link the submitted form event to a custom function
w2pClientAPI.onSubmit = function(data){
  if (data.form.accepted){window.alert("Done!");}
  else {window.alert("It seems that the cheese is not runny enough.");}
  // you can get the complete error descriptions with this command
  var myErrors = data.form.errors;
}
// here we submit the form for validation
w2pClientAPI.submit();
```

Update forms can delete records by setting this attribute before submission:

```
w2pClientAPI.form.vars.delete_this_record = true;
```

## Querying the database ##

Retrieving data with clientapi is simple thanks to web2py dictionary query syntax. Here we get all runny cheese from the cheese shop

```
// create a query
// (note that for very large cheese databases we should make a
// more specific query)
var myQuery = {"second": 0,
               "first": {"fieldname": "id",
                         "tablename": "cheese"},
               "op": "GT"};
// now we submit the query to the server and pass a data handler
// the data handler arg is optional and can be set with
// w2pClientAPI.onQuery.
// clientapi stores query results in w2pClientAPI.rows
w2pClientAPI.query("db", myQuery, function(data){
  if (data.rows.length == 0){
    window.alert("I'm afraid we are out of cheese.");}
});
```

## Note on user rights ##

Default rbac options require the user that consumes any service to be authenticated with web2py Auth (the default scaffolding authentication built-in facility). It's also required that form submitters be members of the manager group or have create or update access to the referenced table. RBAC and authentications options are customizable by specifying the following settings

```
# requires takes a built-in or custom authentication decorator
# it defaults to auth.requires_login
clientapi.settings.requires = <decorator function>

# rbac has the following signature:
# action, name, table, value
# it must return a (bool, data) pair where
# data is the data requested
# If the first item is False, the api
# returns an access denied response.
clientapi.settings.rbac = <function>
```