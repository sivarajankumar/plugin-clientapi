# -*- coding: utf-8 -*-

#    plugin_clientapi: web2py simple JS client
#    Copyright (C) 2013 Alan Etkin <spametki@gmail.com>

#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.

#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.

#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

from gluon.serializers import json, loads_json

# Create an api instance when not found
if not plugins.clientapi.pcapi:
    plugin_clientapi()

myclientapi = plugins.clientapi.pcapi


@auth.requires_login()
def test():
    myclientapi.settings.setup = True
    myclientapi.settings.onsetup = "w2pClientAPITest.test"
    response.files.append(URL(c="static",
                              f="plugin_clientapi/clientapitest.js"))
    script = myclientapi()
    return dict(script=script)

@myclientapi.settings.requires()
def api():
    """
    Action args:
    (index/value)
    1: DAL instance name
    3: One of setup/form/query
    5: Tablename
    7: Record id

    WARNING: this api exposes all validator options to the client
    For fine-grained access control, consider applying default
    validator filters

    NOTE: multiple db CRUD is not supported unless you
    write your own validation because it is not
    implemented in Auth.

    WARNING: applying some queries without sanitization might
    expose the system to code injections. You should inspect
    each validator and any other environment object sent
    by the client.

    Only json queries supported.
    TODO: read xml and yaml queries

    Note: Query dicts do not implement .select(args)

    Test equirements
    Logged-in auth user
    This is an example of w2p dict query
    {'second': 0, 'ignore_common_filters': false, 'optional_args': {},
     'first': {'fieldname': 'id', 'tablename': 'auth_user'},
     'op': 'GT'}
     It's equivalent to the server query expression:
     db.auth_user.id > 0

    """

    # CORS basic setup
    if myclientapi.settings.origin:
        response.headers['Access-Control-Allow-Origin'] = \
            myclientapi.settings.origin
        response.headers['Access-Control-Allow-Credentials'] = \
            myclientapi.settings.credentials or 'false'
        response.headers['Access-Control-Allow-Methods'] = \
            myclientapi.settings.methods or ''

    # handle logging
    if myclientapi.settings.log and (not myclientapi.settings.logged):
        myclientapi.settings.log()
        myclientapi.settings.logged = True

    if "_serialized" in request.vars:
        _serialized = request.vars.pop("_serialized")
        try:
            serialized = loads_json(_serialized)
        except (ValueError, TypeError, SyntaxError):
            raise HTTP(500, T("Error retrieving serialized values"))
        for k in request.vars.keys():
            try:
                if k in serialized:
                    request.vars[k] = loads_json(request.vars[k])
            except (ValueError, TypeError, SyntaxError):
                raise HTTP(500, T("Could not parse the %s value") % k)

    if request.args(3) == "setup":
        result = myclientapi.settings.rbac("setup", None, None, None)
        if result[0]:
            schemes = result[1]
        else:
            raise HTTP(403, T("Access denied (no setup rights)"))
        return dict(schemes=schemes, dbnames=schemes.keys())

    elif request.args(3) == "form":
        table = myclientapi.database[request.args(5)]
        record = request.args(7)
        if record:
            if myclientapi.settings.rbac("form", "update", table,
                                         record)[0]:
                form = SQLFORM(table, record, deletable=True)
            else:
                raise HTTP(403, T("Access denied (no update rights)"))
        else:
            if myclientapi.settings.rbac("form", "create", table,
                                         None)[0]:
                form = SQLFORM(table)
            else:
                raise HTTP(403, T("Access denied (no create rights)"))
        form.process()
        data = form.as_dict(flat=True)
        response.flash = None
        return dict(form=data)

    elif request.args(3) == "query":
        if request.is_gae:
            raise HTTP(500, T("Not implemented"))
        query = myclientapi.database(request.vars.query).query
        result = myclientapi.settings.rbac("query",
                                           None, None, query)
        if result[0]:
            if result[1] is None:
                raise HTTP(500, T("Invalid Query"))
            else:
                data = myclientapi.database(
                    result[1]).select().as_dict()
        else:
            raise HTTP(403, T("Access denied (no query rights)"))
        return dict(rows=data)

    elif request.args(3) == "user":
        if request.args(5) == "login":
            if auth.user_id:
                raise HTTP(500,
                           T("There is an already open user session"))
            else:
                result = auth.login_bare(request.vars.username,
                                         request.vars.password)
                if result:
                    message = T("ok")
                    profile = auth.user.as_dict()
                else:
                    message = T("Login failed")
                    profile = None
                return dict(profile=profile, message=message)
        elif request.args(5) == "logout":
            if not auth.is_logged_in():
                raise HTTP(500, T("There is no user session"))
            session.auth = None
            return dict(profile=None, message=T("ok"))
        else: raise HTTP(500,
                         T("Not implemented: %s") % request.args(5))
        return dict(result=None)
    else:
        raise HTTP(500, T("Invalid operation %s") % request.args(3))

