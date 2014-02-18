from django import template
from django.template.loader import render_to_string

register = template.Library()


@register.simple_tag(takes_context=True)
def template_snippet(context, identifier, page):
    content = page._snippets(identifier, '')
    if not context['request'].user.is_staff():
        return content
    return '<span live-editable-richtext data-identifier=%(identifier)s>%(content)s</span><button href="" btn-data-identifier=%(identifier)s class="live-edit-richtext-btn">edit richtext</button>' % {
        'identifier': identifier,
        'content': content,
    }


@register.simple_tag(takes_context=True)
def frontend_editor_panel(context):
    if context['request'].user.is_staff():
        return render_to_string('allink_frontend_editor/panel.html', context)
    return ''
