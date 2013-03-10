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

from gluon.globals import Storage
import datetime

# plugin table: log
db.define_table("plugin_clientapi_log",
                Field("user_id", "reference auth_user",
                      default=auth.user_id),
                Field("url", requires=IS_EMPTY_OR(IS_URL())),
                Field("args", "list:string"),
                Field("vars", "text"),
                Field("logged", "datetime", default=request.now, 
                      writable=False))


class PluginClientAPI(object):
    """
    Base api instance object for plugin setup.

    It stores settings, default methods and builds the
    client JavaScript source dinamically.
    """

    def requires(self, *args, **kwargs):
        if ((request.application==self.settings.a) and 
            (request.controller==self.settings.c) and
            (request.function == self.settings.f) and
            (request.args(3) == "user")):
            return auth.requires(True, requires_login=False)
        else:
            return auth.requires_login()

    def rbac(self, action, name, table, value):
        """
        action: setup/form/query
        name: read/update
        table: tablename/objectname
        data: id/queryobject
        """
        result, data = False, None
        is_manager = auth.has_membership(role="manager")
        if action == "setup":
            data = dict([(k, v.as_dict(flat=True))
                         for k, v in self.databases.items()])
            return True, data
        elif action == "form":
            if name == "update":
                if is_manager or auth.has_permission(name,
                                                     table, value):
                    return True, None
            elif name == "create":
                if is_manager or auth.has_permission(name, table):
                    return True, None
        elif action == "query":
            if is_manager: return True, value
            else:
                data = auth.accessible_query("read", value)
                return True, data
        return False, None

    def log(self):
        vars = dict(request.vars)
        auth.db.plugin_clientapi_log.insert(user_id=auth.user_id,
                                            url=request.url,
                                            args=request.args,
                                            vars=vars)

    def __init__(self, a=request.application, c="plugin_clientapi",
        f="api", protocol="json", url=None):

        # append base script to the response
        apiurl = URL(c="static", f="plugin_clientapi/clientapi.js")
        if not apiurl in response.files:
            response.files.append(apiurl)

        self.settings = Storage()

        self.settings.application = self.settings.a = a
        self.settings.controller = self.settings.c = c
        self.settings.function = self.settings.f = f
        self.settings.protocol = protocol

        self.settings.url = url or \
            URL(c=self.settings.c, f=self.settings.f,
                extension=self.settings.protocol)

        self.settings.setup = True
        self.settings.onsetup = None
        self.settings.logged = False

        self.settings.requires = self.settings.rbac = \
        self.settings.log = True

        gd = globals()
        self.databases = dict([(name, gd[name]) for name in gd
                               if isinstance(gd[name], DAL)])
        self.dbnames = self.databases.keys()
        self.dbname = request.args(1)

        if self.dbname in self.dbnames:
            self.database = gd[dbname]
        else:
            try:
                self.database = db
            except NameError:
                raise HTTP(500,
                           T("Database not found"))

    def __call__(self):
        # return an initialization script for views
        setup = "false"
        profile = "null"
        onsetup = self.settings.onsetup or "null"
        url = self.settings.url

        if self.settings.dbname:
            dbname = '"%s"' % self.settings.dbname
        else: dbname = "null"

        if auth.is_logged_in():
            profile = auth.user.as_json()
            if self.settings.setup:
                setup = "true"

        script = """
                 if (jQuery){
                   if (w2pClientAPI){
                     w2pClientAPI.profile = %(profile)s;
                     jQuery(function(){
                         if (%(setup)s){
                             w2pClientAPI.setup("%(url)s",
                                                %(dbname)s,
                                                %(onsetup)s);}
                       });
                   }
                   else{
                     try{
                       console.log("w2pClientAPI error: API not found")
                     }
                     catch(e){
                       window.alert("w2pClientAPI error: API not found");
                     }
                   }
                 }
                 else{
                  try{
                    console.log("w2pClientAPI error: no jQuery")
                  }
                  catch(e){
                    window.alert("w2pClientAPI error: no jQuery");
                   }
                 }
                 """ % dict(url=url, setup=setup, onsetup=onsetup,
                            profile=profile, dbname=dbname)

        return SCRIPT(script)

def plugin_clientapi():
    from gluon.tools import PluginManager
    plugins = PluginManager('clientapi', setup=False, onsetup=None,
                            log=True, origin=None, pcapi=None,
                            protocol="json")

    # retrieve api constructor options
    pcapi_vars = dict()
    for k in ("application", "controller", "function",
              "protocol", "url"):
        if k in plugins.clientapi:
            pcapi_vars[k] = plugins.clientapi[k]

    # assign the api instance as plugin setting value
    plugins.clientapi.pcapi=PluginClientAPI(**pcapi_vars)

    # update api settings
    plugin_clientapi_values = plugins.clientapi.copy()
    # but do not overwrite the api instance
    plugin_clientapi_values.pop("pcapi")
    plugins.clientapi.pcapi.settings.update(plugin_clientapi_values)

    # set customizable methods
    for k in ("log", "rbac", "requires"):
        v = None
        if k in plugins.clientapi:
            if plugins.clientapi[k] in (None, True):
                v = getattr(plugins.clientapi.pcapi, k)
            elif callable(plugins.clientapi[k]):
                v = plugins.clientapi[k]
            elif plugins.clientapi[k] == False:
                if k == "log": v = lambda:None
                elif k == "rbac":
                    v = lambda a, b, c, d: (True, None)
                elif k == "requires":
                    v = lambda *args, **kwargs: auth.requires(True,
                            requires_login=False)
        else:
            v = getattr(plugins.clientapi.pcapi, k)
        plugins.clientapi.pcapi.settings[k] = v

    # return the api client script for views
    return plugins.clientapi.pcapi()

