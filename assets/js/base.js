// Instance
airteams.instance_init = function () {
    airteams.instance_rend(function(){
        airteams.instance_bind();
        airteams.bootstrap_placeHolder();
        var request = location.pathname,
            routes = {
                '/': 'dashboard_rend',
                '/support': 'component_support_rend',
                '/apps': 'component_apps_rend',
                '/settings/personal': 'settings_personal_rend',
                '/settings/teams': 'settings_teams_rend',
                '/settings/share': 'settings_share_rend',
                '/dashboard': 'dashboard_rend',
                '/customers': 'customers_rend',
                '/calendar': 'calendar_rend',
                '/opportunities': 'opportunities_rend',
                '/cases': 'cases_rend',
                '/reports' : 'reports_rend',
                '/plugins': 'plugins_rend'
            },
            bool = false,
            controller;
        for (var rule_item in routes) {
            var regexp = new RegExp('^' + rule_item + '$');
            if (regexp.test(request)) {
                controller = 'airteams.' + routes[rule_item] + '()';
                bool = true;
                break;
            }
        };
        if (bool) $('#component_window_wait').fadeOut('slow', function () {
            eval(controller);
        });
        else {
            airteams.instance_push(i18n['9001'], '/404');
            $('#component_window_wait').css('background-image', "url('/assets/img/404.jpg')");
        }
    });
};
airteams.instance_bind = function () {
    $(document).delegate('body', 'click', function (e) {
        var target = $(e.target) || $(e.srcElement);
        if (!target.closest('[data-window=true]').length) {
            $('[data-window=true]').each(function () {
                eval('airteams.' + $(this).attr('data-close') + '()');
            });
        }
    }).delegate('[data-method]', 'click', function (e) {
        eval('airteams.' + $(this).attr('data-method') + '(e, $(this))');
    }).delegate('[data-mouse]', 'mouseenter', function (e) {
        var title = $(this).attr('data-mouse'),
            element = $(this);
        $('body').append('<div id="component_mouse"><div class="arrow"></div><div class="inner">' + title + '</div></div>');
        $('#component_mouse').css('top', element.offset().top + element.height()).css('left', element.offset().left - (($('#component_mouse').width() - element.width())/2));

    }).delegate('[data-mouse]', 'mouseleave', function (e) {
        $('#component_mouse').remove();
    });
};
airteams.instance_push = function (_title, _pathName) {
    if (_title) document.title = airteams.title + ' - ' + _title;
    else document.title = airteams.title;
    if (history && history.pushState) history.pushState(null, null, _pathName);
};
airteams.instance_rend = function (_callback) {
    this.instance_call('instance', {}, function (response) {
        _callback();
        airteams.instance_pack(response);

        var params = airteams.instance_i18n(1001, 1002, 1003, 1004);
        params.USER_NAME = airteams.storages.USER.NAME;
        params.USER_HEAD = airteams.bootstrap_loadUserHead(airteams.storages.USER.HEAD);
        $('#component_head').html(Handlebars.compile($('#templet_component_head').html())(params));
        $('#component_search_input').on('input propertychange', function () {
            if ($(this).val()) {
                if (call_instance) call_instance.abort();
                $('#component_search_results').html('').append('<li><a><em>' + i18n['1007'] + ' ...</em></a></li>');
                airteams.instance_call('search/common', {
                    'SEARCH_CONDITION': $('#component_search_input').val()
                }, function (response) {
                    $('#component_search_results').html('').attr('data-window', true);
                    if (response.length) {
                        $('#component_search_results').html('');
                        for (var index = 0; index < response.length; index++) {
                            var item = response[index], model;
                            if (item.MODEL == 'CUSTOMER_ORGNAZATION') model = i18n['1005'];
                            else if (item.MODEL == 'CUSTOMER_PERSON') model = i18n['1006'];
                            else if (item.MODEL == 'DEAL') model = i18n['1009'];
                            else if (item.MODEL == 'CASE') model = i18n['1010'];
                            $('#component_search_results').append('<li><a data-method="component_search_results_load" data-model="' + item.MODEL + '" data-relation="' + item.ID + '"><em>' + model + '</em>' + item.NAME + '</a></li>');
                        }
                    } else $('#component_search_results').append('<li><a><em>' + i18n['1008'] + '</em></a></li>');
                });
            } else airteams.component_search_results_remove();
        });

        $('#component_menu').html(Handlebars.compile($('#templet_component_menu').html())(
            airteams.instance_i18n(8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008)
        ));

        var params = airteams.instance_i18n(1011, 1012, 1013, 1014, 1015);
        params.USER_NAME = airteams.storages.USER.NAME;
        params.USER_HEAD = airteams.bootstrap_loadUserHead(airteams.storages.USER.HEAD);
        params.USER_EMAIL = airteams.storages.USER.EMAIL;
        $('#component_window_account').html(Handlebars.compile($('#templet_component_window_account').html())(params));

        if (i18n['NAME'] == 'zh-cn') {
            $('#component_menu .chinese_simplified').addClass('active');
        } else {
            $('#component_menu .english').addClass('active');
        }



    });
};
airteams.instance_i18n = function () {
    var result = {};
    for (var index = 0; index < arguments.length; index++) result['I' + arguments[index].toString()] = eval("i18n['" + arguments[index].toString() + "']");

    return result;
};
airteams.instance_shut = function (e) { 
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
};
airteams.instance_call = function (_method, _params, _callback) {
    _params.access_token = this.settings.apiToken;
    call_instance = $.ajax({
        type: 'POST', url: this.settings.apiRoot + _method + '?request_type=json&' + (new Date()).valueOf(), data: _params,
        success: function (_message) {
            if (call_instance.statusText == 'OK') airteams.instance_sure(_message, function () {
                _callback(_message.response);
            });
        },
        error: function (_message) {
            if (!(typeof (call_instance) == 'undefined') && call_instance.statusText != 'abort') alert(i18n['9002']);
        }
    });
};
airteams.instance_sure = function (_message, _callback) {
    switch (_message.response) {
        case 'INVALID_TOKEN':
            top.location.href = '/login';
            break;
        case 'METHOD_NOT_EXISTS':
            alert(i18n['9003']);
            break;
        case 'PARAMETERS_INCOMPLETE':
            alert(i18n['9004']);
            break;
        default:
            _callback();
    }
};
airteams.instance_pack = function (_message) { 
    airteams.storages = {
        'USER': { 
            'ID': _message.USER_ID, 
            'EMAIL': _message.USER_EMAIL,
            'NAME': _message.USER_NAME, 
            'TITLE': _message.USER_TITLE, 
            'HEAD': _message.USER_HEAD, 
            'TIMEZONE' : _message.USER_TIMEZONE
        },
        'ACCOUNT': { 
        },
        'TEAM' : _message.TEAM
    };
};

// Bootstraps
airteams.bootstrap_placeHolder = function () {
    $('input[placeholder][type=text]').placeholder();
};
airteams.bootstrap_clearWorkspace = function (_callback) {
    $('#workspace').hide().html('');
    $('#component_window_wait_workspace').show();
    _callback();
};
airteams.bootstrap_rendWorkspace = function (_templet, _params) {
    $('#component_window_wait_workspace').hide();
    $('#workspace').html(Handlebars.compile($('#' + _templet).html())(_params)).show();;
};
airteams.bootstrap_loadUser = function (_id) {
    for (var index = 0; index < airteams.storages.TEAM.length; index++) { 
        if(airteams.storages.TEAM[index].ID == _id) return airteams.storages.TEAM[index];
    }
};
airteams.bootstrap_loadUserHead = function (_head) {
    if (!_head) return '/assets/img/avatar.jpg';
    else return head;
};
airteams.bootstrap_loadOrgnazationHead = function (_head) { 
    if (!_head) return '/assets/img/avatar_orgnazation.jpg';
    else return head;
};
airteams.bootstrap_loadPersonHead = function (_head) { 
    if (!_head) return '/assets/img/avatar_person.jpg';
    else return head;
};
airteams.bootstrap_loadTime = function (_stamp) {
    var us = new Date(_stamp * 1000);
    return us.getFullYear() + '-' + (us.getMonth() + 1) + '-' + us.getDate() + ' ' + us.getHours() + ':' + us.getMinutes() + ':' + us.getSeconds();
};
airteams.bootstrap_loadTimeFriendly = function (_stamp) {
    var df = Math.round(new Date().getTime() / 1000) - _stamp,
        rt = '';
    if (df < 60) rt = i18n['9100'];
    else if (df < 3600) {
        if(Math.round(df / 60) == 1) rt = Math.round(df / 60) + i18n['9101'];
        else rt = Math.round(df / 60) + i18n['9102'];
    } else if (df < 86400){
        if(Math.round(df / 3600) == 1) rt = Math.round(df / 3600) + i18n['9103'];
        rt = Math.round(df / 3600) + i18n['9104'];
    } else if (df < 1296000){
        if(Math.round(df / 86400) == 1) rt = Math.round(df / 86400) + i18n['9105'];
        rt = Math.round(df / 86400) + i18n['9106'];
    } else {
        rt = airteams.bootstrap_loadTime(_stamp);
    }
    return rt;
};
airteams.bootstrap_loadDevice = function (_device) { 
    switch (_device) {
        case 'IPHONE':
            return i18n['1040'];
            break;
        case 'IPAD':
            return i18n['1041'];
            break;
        case 'ANDROID':
            return i18n['1042'];
            break;
        default:
            return i18n['1043'];
    }
};
airteams.bootstrap_loadFileExt = function (_name) {
    var result = /\.[^\.]+$/.exec(_name);
    if (result) return result[0].replace('.', '').toLowerCase();
    else return false;
};

// Components
airteams.component_window_account_rend = function (e) {
    this.instance_shut(e);
    $('#component_window_account').show().attr('data-window', 'true');
};
airteams.component_window_account_remove = function (e) { 
    $('#component_window_account').hide();
};
airteams.component_search_results_remove = function (e) {
    $('#component_search_input').val('');
    $('#component_search_results').html('').attr('data-window', false);
};
airteams.component_search_results_load = function (e) {
    console.log('Load the customer HERE..');
};
airteams.component_menu_blank = function () { 
    $('#component_menu ul.link a').removeClass('active');
};
airteams.component_menu_active = function (_active) {
    this.component_menu_blank();
    $('#component_menu a[data-method=' + _active + ']').addClass('active');
};
airteams.component_session_delete = function () {
    top.location.href = '/logout';
};
airteams.component_support_rend = function (e) {
    this.instance_push(i18n['1003'], '/support');
    this.component_menu_blank();
    this.bootstrap_rendWorkspace('templet_component_support', this.instance_i18n(1003, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028));
};
airteams.component_apps_rend = function (e) { 
    this.instance_push(i18n['1004'], '/apps');
    this.component_menu_blank();
    this.bootstrap_rendWorkspace('templet_component_apps', this.instance_i18n(1029, 1030, 1031, 1032, 1033, 1034, 1035, 1036));
};
airteams.component_apps_qr_rend = function (e, _element) {
    var link = 'url("' + _element.attr('data-link') + '")';
    $('#component_window_qr').css('background-image', link).show();
};
airteams.component_language = function (e, _element) {
    var language = _element.attr('data-language');
    this.instance_call('user/language/update', {
        'USER_LANGUAGE': language
    }, function (response) {
        top.location.reload();
    });
};

// Dashboard
airteams.dashboard_rend = function (e) {
    this.component_menu_active('dashboard_rend');
    this.instance_push(i18n['8001'], '/dashboard');
    this.bootstrap_rendWorkspace('templet_dashboard', this.instance_i18n(8001, 8009));
    this.dashboard_events_rend(20, 0, null, null, function (response) {
        $('#dashboard ul li.more a').attr('data-loading', false).html(i18n['8010']);
    });
};
airteams.dashboard_events_rend = function (_limit, _skip, _model, _relation, _callback) {
    var params = {};
    if (!_limit) params['LIMIT'] = _limit;
    if (!_skip) params['SKIP'] = _skip;
    if (!_model) params['MODEL'] = _model;
    if (!_relation) params['RELATION'] = _relation;
    this.instance_call('events', params, function (response) {
        for (var index = 0; index < response.length; index++) {
            if (response[index].MODEL == 'ACTION') airteams.dashboard_events_action_rend(response[index]);
            if (response[index].MODEL == 'TASK') airteams.dashboard_events_task_rend(response[index]);
            if (response[index].MODEL == 'ORGNAZATION') airteams.dashboard_events_customer_rend(response[index]);
            if (response[index].MODEL == 'PERSON') airteams.dashboard_events_customer_rend(response[index]);
        }
        _callback(response);
    });
};
airteams.dashboard_events_message_pack = function (_response) {
    var result = {
        'USER_ID': _response.USER.ID,
        'USER_NAME': _response.USER.NAME,
        'FLITER_MODEL': _response.MODEL,
        'MESSAGE_PARAMS': _response.PARAMS,
        'MESSAGE_DEVICE': airteams.bootstrap_loadDevice(_response.FROM.DEVICE),
        'MESSAGE_DEVICE_CODE': _response.FROM.DEVICE,
        'MESSAGE_BY': i18n['1044'],
        'MESSAGE_FROM': i18n['1045'],
        'MESSAGE_CAME': i18n['1046'],
        'MESSAGE_TIME': airteams.bootstrap_loadTimeFriendly(_response.CREATED),
        'MESSAGE_TIME_FULL': airteams.bootstrap_loadTime(_response.CREATED),
        'MESSAGE_TIME_CODE': _response.CREATED
    };

    if (_response.PARAMS.NOTE) {
        result['NOTE_CONTENT'] = _response.PARAMS.NOTE.CONTENT;
        result['NOTE_RELATION'] = _response.PARAMS.NOTE.ID;
        result['NOTE_LINK'] = i18n['1067'];
    }

    return result;
};
airteams.dashboard_events_action_rend = function (_response) {
    var params = this.dashboard_events_message_pack(_response);
    params['MODEL'] = i18n['1055'];
    params['HEAD_IMAGE'] = airteams.bootstrap_loadUserHead(_response.USER.HEAD);
    params['HEAD_METHOD'] = 'user_rend';
    params['HEAD_RELATION'] = _response.USER.ID;
    params['FROM_NAME'] = _response.FROM.NAME;
    params['FROM_METHOD'] = 'user_rend';
    params['FROM_RELATION'] = _response.FROM.ID;
    
    switch (_response.BODY.CONTENT) {
        case 'USER_CREATED':
            params['BODY_CONTENT'] = i18n['1061'];
            break;
        case 'USER_UPDATED':
            params['BODY_CONTENT'] = i18n['1062'];
            break;
        default:
    }
    this.dashboard_events_append(_response.MODEL, params);
};
airteams.dashboard_events_task_rend = function (_response) {
    var params = this.dashboard_events_message_pack(_response);
    params['MODEL'] = i18n['1053'];
    params['HEAD_IMAGE'] = airteams.bootstrap_loadUserHead(_response.USER.HEAD);
    params['HEAD_METHOD'] = 'user_rend';
    params['HEAD_RELATION'] = _response.USER.ID;
    params['FROM_NAME'] = _response.FROM.NAME;
    params['FROM_METHOD'] = 'user_rend';
    params['FROM_RELATION'] = _response.FROM.ID;
    params['LINK_NAME'] = _response.BODY.LINK.NAME;
    params['LINK_METHOD'] = 'task_rend';
    params['LINK_RELATION'] = _response.BODY.LINK.ID;
    switch (_response.BODY.CONTENT) {
        case 'TASK_CREATED':
            params['BODY_CONTENT'] = i18n['1058'];
            break;
        case 'TASK_DELETED':
            params['BODY_CONTENT'] = i18n['1059'];
            break;
        case 'TASK_UPDATED':
            params['BODY_CONTENT'] = i18n['1060'];
            break;
        case 'TASK_DONE':
            params['BODY_CONTENT'] = i18n['1056'];
            break;
        case 'TASK_PROCESSING':
            params['BODY_CONTENT'] = i18n['1057'];
            break;
        default:
    }
    this.dashboard_events_append(_response.MODEL, params);
};
airteams.dashboard_events_customer_rend = function (_response) {
    var params = this.dashboard_events_message_pack(_response);
    if (_response.MODEL == 'ORGNAZATION') {
        params['MODEL'] = i18n['1047'];
        params['HEAD_METHOD'] = 'customers_orgnazation_rend';
        params['LINK_METHOD'] = 'customers_orgnazation_rend';
        params['FLITER_MODEL'] = 'ORGNAZATION';
        params['HEAD_IMAGE'] = airteams.bootstrap_loadOrgnazationHead(_response.FROM.HEAD);
    } else if (_response.MODEL == 'PERSON') {
        params['MODEL'] = i18n['1048'];
        params['HEAD_METHOD'] = 'customers_person_rend';
        params['LINK_METHOD'] = 'customers_person_rend';
        params['FLITER_MODEL'] = 'PERSON';
        params['HEAD_IMAGE'] = airteams.bootstrap_loadPersonHead(_response.FROM.HEAD);
    }
    params['HEAD_RELATION'] = _response.BODY.LINK.ID;
    params['FROM_NAME'] = _response.FROM.NAME;
    params['FROM_METHOD'] = 'user_rend';
    params['FROM_RELATION'] = _response.FROM.ID;
    params['USER_ID'] = _response.USER.ID;
    params['USER_NAME'] = _response.USER.NAME;
    params['LINK_NAME'] = _response.BODY.LINK.NAME;
    params['LINK_RELATION'] = _response.BODY.LINK.ID;

    switch (_response.BODY.CONTENT) {
        case 'CUSTOMER_CREATED':
            params['BODY_CONTENT'] = i18n['1063'];
            break;
        case 'CUSTOMER_UPDATED':
            params['BODY_CONTENT'] = i18n['1064'];
            break;
        case 'OWNER_UPDATED':
            params['BODY_CONTENT'] = i18n['1065'];
            params['FROM_METHOD'] = params['HEAD_METHOD'];
            params['FROM_RELATION'] = params['HEAD_RELATION'];
            params['LINK_METHOD'] = 'user_rend';
            break;
        case 'NOTE_CREATED':
            params['BODY_CONTENT'] = i18n['1066'];
            params['FROM_METHOD'] = params['HEAD_METHOD'];
            params['FROM_RELATION'] = params['HEAD_RELATION'];
            delete params['LINK_RELATION'];
            break;
        default:
    }
    airteams.dashboard_events_append(_response.MODEL, params);
};
airteams.dashboard_events_append = function (_model, _params) {
    var templet = $('#templet_dashboard_events_item');
    _params['DATA_ID'] = (new Date()).valueOf() + Math.floor(Math.random() * (1000 + 1));
    $('#dashboard .event li.fliter').after(Handlebars.compile(templet.html())(_params));
    var element = $('#dashboard .event li[data-id=' + _params.DATA_ID + ']')
    if (!_params['LINK_RELATION'] || !_params['LINK_NAME']) element.find('span.relation').remove();
    if (!_params['MESSAGE_PARAMS']['NOTE']) element.find('div.message_note').remove();
    if (!_params['MESSAGE_PARAMS']['FILE']) element.find('div.message_file').remove();
    else {
        var file_count = _params.MESSAGE_PARAMS.FILE.length;
        for (var file_index = 0; file_index < file_count; file_index++) {
            var file_item = _params.MESSAGE_PARAMS.FILE[file_index],
                file_ext = airteams.bootstrap_loadFileExt(file_item['NAME']),
                file_params = {
                    'FILE_CLASS': 'icon_' + file_ext,
                    'FILE_NAME': file_item['NAME'],
                    'FILE_RELATION': file_item['ID'],
                    'FILE_URL': file_item['URL']
                };
            if (file_ext == 'jpg') {
                element.find('div.message_file div.image_list').append(Handlebars.compile($('#templet_dashboard_events_item_image').html())(file_params));
            } else {
                element.find('div.message_file div.file_list').append(Handlebars.compile($('#templet_dashboard_events_item_file').html())(file_params));
            }
        }
        if(element.find('div.message_file div.image_list div').length == 0) element.find('div.message_file div.image_list').remove();
        if(element.find('div.message_file div.file_list div').length == 0) element.find('div.message_file div.file_list').remove();
    }
};

// Customers
airteams.customers_rend = function (e) { 
    this.instance_push(i18n['8003'], '/customers');
    this.component_menu_active('customers_rend');
    this.bootstrap_rendWorkspace('templet_customers', this.instance_i18n(8003));
};

// Calendar
airteams.calendar_rend = function (e) { 
    this.instance_push(i18n['8004'], '/calendar');
    this.component_menu_active('calendar_rend');
    this.bootstrap_rendWorkspace('templet_calendar', this.instance_i18n(8004));
};

// Opportunities
airteams.opportunities_rend = function (e) { 
    this.instance_push(i18n['8005'], '/opportunities');
    this.component_menu_active('opportunities_rend');
    this.bootstrap_rendWorkspace('templet_opportunities', this.instance_i18n(8005));
};

// Cases
airteams.cases_rend = function (e) { 
    this.instance_push(i18n['8006'], '/cases');
    this.component_menu_active('cases_rend');
    this.bootstrap_rendWorkspace('templet_cases', this.instance_i18n(8006));
};

// Plugins
airteams.plugins_rend = function (e) { 
    this.instance_push(i18n['8007'], '/plugins');
    this.component_menu_active('plugins_rend');
    this.bootstrap_rendWorkspace('templet_plugins', this.instance_i18n(8007));
};

// Reports
airteams.reports_rend = function (e) {
    this.instance_push(i18n['8008'], '/reports');
    this.component_menu_active('reports_rend');
    this.bootstrap_rendWorkspace('templet_reports', this.instance_i18n(8008));
};

// Settings
airteams.settings_personal_rend = function (e) {
    this.instance_push(i18n['1012'], '/settings/personal');
    this.component_menu_blank();
    this.component_window_account_remove();
    this.bootstrap_rendWorkspace('templet_settings_personal', this.instance_i18n(1012));
};
airteams.settings_teams_rend = function (e) { 
    this.instance_push(i18n['1013'], '/settings/teams');
    this.component_menu_blank();
    this.component_window_account_remove();
    this.bootstrap_rendWorkspace('templet_settings_teams', this.instance_i18n(1013));
};
airteams.settings_share_rend = function (e) { 
    this.instance_push(i18n['1014'], '/settings/share');
    this.component_menu_blank();
    this.component_window_account_remove();
    this.bootstrap_rendWorkspace('templet_settings_share', this.instance_i18n(1014));  
};


// Init
$(document).ready(function(){
    airteams.instance_init();
});

// TEST
airteams = function () { 

};

window.airteams = window.airteams || (function (_token) {
    return {
        'instance': {},
        'bootstrap': {}
    }
})();