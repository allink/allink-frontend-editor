(function($) {
    $(function() {
        new FrontendEditor();
    });

    var FrontendEditor = function() {
        this.initDom();
        this.initActions();
    };

    FrontendEditor.prototype = {
        initDom: function() {
            this.$panel = $('#frontend-editor-panel');
            
            this.inline_edit = $('.frontend-editor-edit.inline');
            this.inline_edit_content = this.inline_edit.find('.frontend-editor-content');
            this.inline_edit_btn = this.inline_edit.find('.frontend-editor-btn');
            this.richtext_edit = $('.frontend-editor-edit.lightbox');

            this.active_anchor = null;

            this.save_btn = $('#live-edit-save');

            this.lightbox_container = $('#frontend-editor-lightbox');

            this.edit_start_btn = $('#live-edit-start');
            this.edit_stop_btn = $('#live-edit-stop');
            this.edit_save_btn = $('#live-edit-save');

            this.updated_warning = $('#updated-warning');
        },
        // init user actions
        initActions: function() {
            this.edit_start_btn.click($.proxy(this.startEditing, this));
            this.edit_stop_btn.click($.proxy(this.stopEditing, this));
            this.edit_save_btn.click($.proxy(this.saveAll, this));

            this.selectedContent = null;
            var self = this;

            // focusin inline edit
            this.inline_edit.focusin(function() {
                var $this = $(this);
                var $button = $this.find('.frontend-editor-btn');
                var $content = $this.find('.frontend-editor-content');
                $button.addClass('edit');
                if($content.find('.frontend-editing-placeholder').length)
                    $content.html('');
                self.selectedContent = $this.html();
            }).focusout(function() {
                // var $this = $(this);

                // var $button = $this.find('.frontend-editor-btn');
                // $button.removeClass('edit');

                // // selected content stayed the same, do not save
                // if(self.selectedContent == $this.html())
                //     return;

                // // if its not richtext, then call striptags
                // if(!$this.hasClass('tinymce'))
                //     $this.find('.frontend-editor-content').html(self.stripTag($this.html()));

                // // save data
                // self.saveData($this);

                // self.selectedContent = null;
            });

            this.inline_edit_btn.click(function(event) {
                event.preventDefault();
                var $this = $(this);
                var $content = $(this).parent().find('.frontend-editor-content');
                if(!$this.hasClass('edit')) {
                    $this.addClass('edit');
                    if($content.find('.frontend-editing-placeholder').length)
                        $content.html('');
                    $content.focus();
                }
                else {
                    $(window).focus();
                    $this.removeClass('edit');
                    self.saveData($this.parent());
                }
            });
        },
        startEditing: function() {
            this.inline_edit.addClass('marked-editable');
            this.inline_edit_content.attr('contenteditable', 'true');
            this.richtext_edit.addClass('marked-editable');

            this.edit_stop_btn.show();
            this.edit_start_btn.hide();

            tinymce.init(window.tinymce_inline_config);

            this.inline_edit_content.each(function(key, value) {
                if(!$(this).text()) {
                    $(this).addClass('empty');
                }
            });

            var self = this;
            // open richtext editor
            this.richtext_edit.click(function() {
                event.preventDefault();
                self.current_richtext = $(this).find('.frontend-editor-content');
                self.active_identifier = $(this).attr('data-identifier');
                self.openRichtextInLightbox(self.active_identifier);
            });
        },
        stopEditing: function() {
            this.inline_edit.removeClass('marked-editable');
            this.inline_edit_content.attr('contenteditable', 'false');
            this.richtext_edit.removeClass('marked-editable');

            this.edit_stop_btn.hide();
            this.edit_start_btn.show();

            tinymce.remove('span.tinymce.inline');

            this.richtext_edit.unbind();
        },
        // save inline data
        saveData: function($inline_edit) {
            var stripped_tring = $inline_edit.html();
            if(!$inline_edit.hasClass('tinymce'))
                stripped_tring = this.stripTag($inline_edit.html());
            var identifier = $inline_edit.attr('data-identifier');
            var inline_text_list = "text=" + escape(stripped_tring) + '&' +
                                   "csrfmiddlewaretoken=" + getCookie('csrftoken');

            $.ajax({
                url: '/admin/page/page/1/snippets/' + identifier + '/',
                method: 'POST',
                data: inline_text_list
            });
            this.showQuickInfo();
        },
        // display small window to show that data is saving
        showQuickInfo: function(text) {
            if(!this.save_progress_view)
                this.save_progress_view = this.$panel.find('.save-progress');

            if(!this.quick_info_content)
                this.quick_info_content = this.$panel.find('.quick-info-content');
            
            // this.quick_info_content.html(text);
                
            this.save_progress_view.fadeIn();
            setTimeout($.proxy(function() {
                this.save_progress_view.fadeOut();
            }, this), 1500);
        },
        showUpdatedWarning: function() {
            this.updated_warning.show();
        },
        stripTag: function(text) {
            return text.replace(/(?!<br>)(<([^>]+)>)/ig,"");
        },
        openRichtextInLightbox: function(identifier) {
            var self = this;
            $.ajax({
                url: '/admin/page/page/1/snippets/' + identifier + '/',
                success: function(result) {
                    self.lightbox_container.find('.content').html(result);
                    self.tinymce = tinymce.init(window.tinymce_config);
                    self.lightbox_container.show();
                    // lightbox save
                    self.lightbox_container.find('form').submit(function(event) {
                        event.preventDefault();
                        var data = $(this).serialize();

                        self.current_richtext.html(tinymce.activeEditor.getContent());

                        data += '&data=' + tinymce.activeEditor.getContent();
                        $.post('/admin/page/page/1/snippets/' + identifier + '/', data,
                            function(result) {
                                self.showQuickInfo(result);
                            });
                        self.cancelLightBox();
                    });
                    // lightbox close
                    self.lightbox_container.find('.cancel').click(function(event) {
                        event.preventDefault();
                        self.cancelLightBox();
                    });
                }
            });

        },
        cancelLightBox: function() {
            this.lightbox_container.hide();
        },
        saveAll: function() {
            var self = this;
            this.inline_edit_btn.removeClass('edit');
            this.inline_edit.each(function(key, value) {
                self.saveData($(value));
            });
        }
    };

    function getCookie(name) {
        var cookieValue = null;
        if(document.cookie && document.cookie) {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
})($);