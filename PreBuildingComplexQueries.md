#how to save code and have web2py write our client queries

# Saving code with server queries #

Sometimes dictionary queries are not trivial, and might require more object notation than we want. Suppose you need to fetch all runny cheese that the shop is out of produced before march 17, 1950 (the day the Californium element was announced), or else it is a Hugh Walpole readers choice. It would take to write something like:

```
{"second": {"second": true,
            "first": {"fieldname": "walpole_readers_choice",
                      "tablename": "cheese"},
            "op": "EQ"},
 "first": {"second": {"first": {"fieldname": "production",
                                "tablename": "cheese"},
                      "second": "1950-03-17",
                      "op": "LT"},
           "first": {"second": true,
                     "first": {"fieldname": "runny",
                               "tablename": "cheese"},
                     "op": "EQ"},
           "op": "AND"},
 "op": "OR"}
```

## Solving the extra syntax issue ##

First: get the query server side with something like

```
myquery = ((db.cheese.stock <= 0)&\
           (db.cheese.production < datetime.date(1950, 3, 17))|\
           (db.cheese.walpole_readers_choice==True))
```

Now we should pass the serialized query so we can use it client-side

```
{{=SCRIPT("""
var myQuery = %(myquery)s;
""" % dict(myquery=myquery.as_json())))}}
```

Then we are able to use the query with the w2pClientAPI object in
the usual way.

```
w2pClientAPI.query("db", myQuery);
```

Consider also storing multiple key-query objects for
easily retrieve them client-side on query submission.

```
{{=SCRIPT("""
var myQueries = %(myQueries)s;
""" % dict(myqueries=<(key, query) pairs dictionary object>))}}
```