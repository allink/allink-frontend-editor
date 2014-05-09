(function($) {
    $(function() {
        new FrontendEditor();
    });

    var FrontendEditor = function() {
        this.initDom();
        this.initActions();
        this.modified_inlines = [];
    };

    FrontendEditor.prototype = {
        initDom: function() {
            this.$panel = $('#frontend-editor-panel');
            
            this.raw_edit = $('.frontend-editor-edit.raw');
            this.raw_edit_btn = this.raw_edit.find('.frontend-editor-btn');

            this.inline_edit = $('.frontend-editor-edit.inline');
            this.inline_edit_content = this.inline_edit.find('.frontend-editor-content');
            this.inline_edit_btn = this.inline_edit.find('.frontend-editor-btn');

            this.richtext_edit = $('.frontend-editor-edit.lightbox');

            this.open_panel_btn = this.$panel.find('.frontend-editor-open-panel-btn');

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

                self.modified_inlines.push(this);
            });

            // click on inline btn
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
                    self.saveData($this.parent(), function() {
                        self.hideQuickInfo();
                    });
                }

                self.modified_inlines.push($(this).parent());
            });

            this.raw_edit.click(function(event) {
                event.preventDefault();
                self.active_identifier = $(this).attr('data-identifier');
                self.openRawtextInLightbox($(this).find('.frontend-editor-content'), self.active_identifier);
            });

            this.open_panel_btn.click(function(event) {
                event.preventDefault();
                var $this = $(this);
                if(!self.is_out) {
                    if(!self.panel_height)
                        self.panel_height = self.$panel.find('.frontend-editor-inner').outerHeight();
                    self.$panel.height(self.panel_height).css('right', 0).addClass('out');
                    self.is_out = true;
                }
                else {
                    self.$panel.height(60).css('right', -110).removeClass('out');
                    self.is_out = false;
                }
            });
        },
        startEditing: function() {
            this.raw_edit.addClass('marked-editable');

            this.inline_edit.addClass('marked-editable');
            // this.inline_edit_content.attr('contenteditable', 'true');
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
            this.raw_edit.removeClass('marked-editable');
            this.inline_edit.removeClass('marked-editable');
            // this.inline_edit_content.attr('contenteditable', 'false');
            this.richtext_edit.removeClass('marked-editable');

            this.edit_stop_btn.hide();
            this.edit_start_btn.show();

            tinymce.remove('.inline .frontend-editor-content');

            this.richtext_edit.unbind();
        },
        // save inline data
        saveData: function($inline_edit, success_handler) {
            var stripped_tring = $inline_edit.find('.frontend-editor-content').html();
            // if(!$inline_edit.hasClass('tinymce'))
            //     stripped_tring = this.stripTag($inline_edit.html());
            // stripped_tring = stripped_tring.replace(/&/g, escape('&')).replace(/;/g, escape(';'));
            var identifier = $inline_edit.attr('data-identifier');
            var inline_text_list = "text=" + encodeURIComponent(stripped_tring) + '&' +
                                   "csrfmiddlewaretoken=" + getCookie('csrftoken');

            $.ajax({
                url: window.allink_frontend_editor_page_url + identifier + '/',
                method: 'POST',
                data: inline_text_list,
                success: success_handler
            });
            this.showQuickInfo();
        },
        // display small window to show that data is saving
        showQuickInfo: function(text) {
            if(!this.save_progress_view)
                this.save_progress_view = $('#frontend-editor-save-progress');

            if(!this.quick_info_content)
                this.quick_info_content = this.$panel.find('.quick-info-content');
            
            // this.quick_info_content.html(text);
                
            this.save_progress_view.fadeIn();
        },
        hideQuickInfo: function() {
            setTimeout($.proxy(function() {
                this.save_progress_view.fadeOut();
            }, this), 1000);
        },
        showUpdatedWarning: function() {
            this.updated_warning.show();
        },
        stripTag: function(text) {
            return text.replace(/(?!<br>)(<([^>]+)>)/ig,"");
        },
        // open lightbox and initialize tinymce
        openRichtextInLightbox: function(identifier) {
            var self = this;
            $.ajax({
                url: window.allink_frontend_editor_page_url + identifier + '/',
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
                        $.post(window.allink_frontend_editor_page_url + identifier + '/', data,
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
        // open lightbox with a textarea for raw usage
        openRawtextInLightbox: function($content, identifier) {
            var content = this.lightbox_container.find('.content');
            content.html('<textarea class="frontend-editor-textarea-raw">' + $content.html() + '</textarea>');
            content.append('<div class="frontend-editor-actions"><a href="#" id="frontend-editor-save-raw">save</a><a href="#" id="frontend-editor-cancel">cancel</a></div>');
            this.lightbox_container.show();

            var self = this;

            // lightbox save
            this.lightbox_container.find('#frontend-editor-save-raw').click(function(event) {
                event.preventDefault();
                data = {
                    text: self.lightbox_container.find('textarea').val()
                };

                $content.html(data.text);

                $.post(window.allink_frontend_editor_page_url + identifier + '/', data,
                    function(result) {
                        self.showQuickInfo(result);
                    });
                self.cancelLightBox();
            });

            this.lightbox_container.find('#frontend-editor-cancel').click(function(event) {
                event.preventDefault();
                self.cancelLightBox();
            });
        },
        cancelLightBox: function() {
            this.lightbox_container.hide();
        },
        saveAll: function() {
            var self = this;
            this.inline_edit_btn.removeClass('edit');
            saved_num = this.modified_inlines.length;
            var success_handler = function() {
                saved_num--;
                if(!saved_num)
                    self.saveDone();
            };
            $(this.modified_inlines).each(function(key, value) {
                self.saveData($(value), success_handler);
            });
            this.modified_inlines = [];
        },
        saveDone: function() {
            this.hideQuickInfo();
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