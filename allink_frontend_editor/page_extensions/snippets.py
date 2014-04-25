from __future__ import absolute_import, unicode_literals

from functools import update_wrapper

from django.contrib.admin.util import unquote
from django.http import HttpResponse
from django.shortcuts import render

from feincms import extensions

from ..fields import JSONField
from ..forms import SnippetForm


class Extension(extensions.Extension):
    def handle_model(self):
        self.model.add_to_class('_snippets', JSONField('Snippets', null=True))

    def handle_modeladmin(self, modeladmin):
        modeladmin_class = type(modeladmin)

        def snippets_view(inner_self, request, object_id, identifier):
            if not request.user.has_module_perms('page'):
                return HttpResponse('Unauthorized', status=401)
            obj = inner_self.get_object(request, unquote(object_id))
            if request.method == 'POST':
                form = SnippetForm(request.POST, page=obj, identifier=identifier)
                if form.is_valid():
                    form.save()
                    return HttpResponse('OK')
            else:
                form = SnippetForm(page=obj, identifier=identifier)
            return render(request, 'allink_frontend_editor/snippet_form.html', {'form': form})

        modeladmin_class.snippets_view = snippets_view

        old_get_urls = modeladmin_class.get_urls

        def get_urls(inner_self):
            from django.conf.urls import patterns, url

            def wrap(view):
                def wrapper(*args, **kwargs):
                    return inner_self.admin_site.admin_view(view)(*args, **kwargs)
                return update_wrapper(wrapper, view)
            info = inner_self.model._meta.app_label, getattr(inner_self.model._meta, 'model_name', inner_self.model._meta.module_name)  # django <1.6 had this as module_name

            urlpatterns = patterns('',
                                   url(r'^(.+)/snippets/([\w_]+)/$', wrap(inner_self.snippets_view), name='%s_%s_snippets' % info),
                                   ) + old_get_urls(inner_self)
            return urlpatterns

        modeladmin_class.get_urls = get_urls
