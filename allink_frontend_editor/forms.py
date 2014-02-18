from django import forms


class SnippetForm(forms.Form):
    text = forms.CharField(widget=forms.widgets.Textarea(attrs={'class': 'tiny_mce'}))

    def __init__(self, *args, **kwargs):
        self.page = kwargs.pop('page')
        self.identifier = kwargs.pop('identifier')
        kwargs['initial'] = {'text': self.page._snippets.get(self.identifier, '')}
        super(SnippetForm, self).__init__(*args, **kwargs)

    def save(self):
        self.page._snippets[self.identifier] = self.cleaned_data['text']
        self.page.save()
