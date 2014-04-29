from django import template
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag(takes_context=True)
def template_snippet(context, identifier, page, editing_type='inline', raw=False):
    content = page._snippets.get(identifier, '')
    print content
    if not context['request'].user.is_staff:
        if raw:
            return content.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        return content
    return '<span class="frontend-editor-edit %(editing_type)s" data-identifier=%(identifier)s><a class="frontend-editor-btn" href="#"><span class="frontend-editor-edit-icon"></span></a><span class="frontend-editor-content">%(content)s</span></span>' % {
        'identifier': identifier,
        'editing_type': editing_type,
        'content': content,
    }


@register.simple_tag(takes_context=True)
def frontend_editor_panel(context):
    if context['request'].user.is_staff:
        return render_to_string('allink_frontend_editor/panel.html', context)
    return ''
