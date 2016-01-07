## A simple javascript client for web2py apps ##

plugin\_clientapi is a multi-purpose client interface for handling web2py services from client frameworks or any javascript client software.
It supports remote database queries, full database scheme and form retrieval, submission and validation with Ajax.

It takes advantage of web2py data serialization api to perform client-server data comunications in a simple and efficient way.

## Examples ##

Retrieving and submitting a form without user intervention requires a few lines:

```
w2pClientAPI.onNewForm = function(){
  w2pClientAPI.form.vars.runny = "very";
  w2pClientAPI.submit();
}
w2pClientAPI.newForm("db", "cheese");
```

Retrieving data is also simple

```
w2pClientAPI.query("db", {"first": {"tablename": "cheese",
                                    "fieldname": "id"},
                          "op": "GT",
                          "second": 0},
                   myCallback);
```

For a full guide go to ClientapiHowTo

## TODO ##
  * Support XML data exchange (currently it only supports JSON)
  * More plugin options (extended default events)
  * Extend api features (file uploads, app management)
  * Client framework simple crud interface

## License ##

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.