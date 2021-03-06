/*
*	© Kalyan Halder 2020
*	github/kalyan312/CacheJS
*	This script uses the HTML5 localStorage API to cache css and js files instead of the normal browser cache.
*/
var cacheJs = function (context) {
    context = {
        config: null,
        loadedCounter: 0,
        resourcesCounter: 0,
        initializeDone: function() {
            console.info('cacheJs finished loading all files');
            context.config.onFinished();
        },
        initialize: function(config) {
            context.getConfig(config);
        },
        getConfig: function(config) {
            context.config = config;
            var localStorageConfig = localStorage.getItem(context.config.configName);
            if (localStorageConfig === null) {
                localStorage.setItem(context.config.configName, JSON.stringify(context.config));
                context.checkFiles(context.config, context.config);
            } else {
                context.checkFiles(context.config, JSON.parse(localStorageConfig));
            }
        },
        checkFiles: function(newConfig, oldConfig) {
            for (var i in newConfig.files) {
                if (newConfig.files.hasOwnProperty(i)) {
                    context.resourcesCounter++;
                }
            }
            for (var i in newConfig.files) {
                if (newConfig.files[i] !== undefined) {
                    if (oldConfig !== {} && oldConfig.files[i] !== undefined) {
                        if (localStorage.getItem(i) !== null && oldConfig.files[i].version === newConfig.files[i].version && newConfig.files[i].version !== "-") {
                            context.checkIfLoaded();
                        } else {
                            context.getFile(i, newConfig.files[i]);
                        }
                    } else {
                        context.getFile(i, newConfig.files[i]);
                    }
                } else {
                    if (newConfig.files[i] !== undefined && localStorage.getItem(i) !== null) {
                        context.getFile(i, newConfig.files[i]);
                    }
                }
            }
            localStorage.setItem(context.config.configName, JSON.stringify(newConfig));
        },
        injectFile: function(name, resource) {
            var resourceTag = document.createElement(resource.type);
            resourceTag.innerHTML = localStorage.getItem(name);
            for (var i in resource.attributes) {
                if (resource.attributes[i] !== undefined) {
                    resourceTag.setAttribute(resource.attributes[i].name, resource.attributes[i].value);
                }
            }
            if(resource.position == 'top'){
                document.head.appendChild(resourceTag);
            }else{
                var h = document.getElementById(context.config.altAssetsPosID);
                if(h) {
                    h.insertAdjacentElement("beforebegin", resourceTag);
                }else{
                    console.log('unable to load resorce coz altAssetsPosID property is undefine or the element not found')
                }
            }
        },
        checkIfLoaded: function() {
            context.loadedCounter++;
            if (context.loadedCounter === context.resourcesCounter) {
                context.injectAllFiles();
            }
        },
        getFile: function(name, resource) {
            var x = new XMLHttpRequest();
            x.onreadystatechange = function() {
                if (x.readyState === 4) {
                    if ([304, 302, 200, 201, 202].indexOf(x.status) !== -1) {
                        localStorage.setItem(name, "/*" + name + "*/\n" + x.responseText);
                        context.checkIfLoaded();
                    } else if (x.status === 0) {
                        var resourceTag = document.createElement(resource.type);
                        switch (resource.type) {
                            case 'style':
                                resourceTag.setAttribute('href', resource.uri);
                                resourceTag.setAttribute('rel', 'stylesheet');
                                break;
                            case 'script':
                                resourceTag.setAttribute('src', resource.uri);
                                break;
                            default:
                                console.warn('Unknown resource type : ' + resource.type);
                        }
                        resourceTag.onload = function() {
                            context.checkIfLoaded();
                        }
                        for (var i in resource.attributes) {
                            if (resource.attributes[i] !== undefined) {
                                resourceTag.setAttribute(resource.attributes[i].name, resource.attributes[i].value);
                            }
                        }
                        if(resource.position == 'top'){
                            document.head.appendChild(resourceTag);
                        }else{
                            var h = document.getElementById(context.config.altAssetsPosID);
                            if(h) {
                                h.insertAdjacentElement("beforebegin", resourceTag);
                            }else{
                                console.log('unable to load resorce coz altAssetsPosID property is undefine or the element not found')
                            }
                        }

                    } else {
                        console.warn('Unable to load Resource : ' + name + '(response code ' + x.status + ')', resource.uri);
                    }
                }
            }
            x.open('GET', resource.uri, true);
            x.send();
        },
        injectAllFiles: function() {
            for (var i in context.config.files) {
                context.injectFile(i, context.config.files[i]);
            }
            context.initializeDone();
        }
    }
    return context;
}
