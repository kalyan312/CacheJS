/*
*	© Kalyan Halder 2020
*	github/kalyan312/CacheJS
*	This script uses the HTML5 localStorage API to cache css and js files instead of the normal browser cache.
*/
var cacheJs = {
    config: null,
    loadedCounter: 0,
    resourcesCounter: 0,
    initializeDone: function() {
        console.info('cacheJs finished loading all files');
        cacheJs.config.onFinished();
    },
    initialize: function(config) {
        cacheJs.getConfig(config);
    },
    getConfig: function(config) {
        var localStorageConfig = localStorage.getItem('cacheJs.localStorageConfig');
        cacheJs.config = config;
        if (localStorageConfig === null) {
            localStorage.setItem('cacheJs.localStorageConfig', JSON.stringify(cacheJs.config));
            cacheJs.checkFiles(cacheJs.config, cacheJs.config);
        } else {
            cacheJs.checkFiles(cacheJs.config, JSON.parse(localStorageConfig));
        }
    },
    checkFiles: function(newConfig, oldConfig) {
        for (var i in newConfig.files) {
            if (newConfig.files.hasOwnProperty(i)) {
                cacheJs.resourcesCounter++;
            }
        }
        for (var i in newConfig.files) {
            if (newConfig.files[i] !== undefined) {
                if (oldConfig !== {} && oldConfig.files[i] !== undefined) {
                    if (localStorage.getItem(i) !== null && oldConfig.files[i].version === newConfig.files[i].version && newConfig.files[i].version !== "-") {
                        cacheJs.checkIfLoaded();
                    } else {
                        cacheJs.getFile(i, newConfig.files[i]);
                    }
                } else {
                    cacheJs.getFile(i, newConfig.files[i]);
                }
            } else {
                if (newConfig.files[i] !== undefined && localStorage.getItem(i) !== null) {
                    cacheJs.getFile(i, newConfig.files[i]);
                }
            }
        }
        localStorage.setItem('cacheJs.localStorageConfig', JSON.stringify(newConfig));
    },
    injectFile: function(name, resource) {
        var resourceTag = document.createElement(resource.type);
        resourceTag.innerHTML = localStorage.getItem(name);
        for (var i in resource.attributes) {
            if (resource.attributes[i] !== undefined) {
                resourceTag.setAttribute(resource.attributes[i].name, resource.attributes[i].value);
            }
        }
        document.head.appendChild(resourceTag);
    },
    checkIfLoaded: function() {
        cacheJs.loadedCounter++;
        if (cacheJs.loadedCounter === cacheJs.resourcesCounter) {
            cacheJs.injectAllFiles();
        }
    },
    getFile: function(name, resource) {
        var x = new XMLHttpRequest();
        x.onreadystatechange = function() {
            if (x.readyState === 4) {
                if ([304, 302, 200, 201, 202].indexOf(x.status) !== -1) {
                    localStorage.setItem(name, "/*" + name + "*/\n" + x.responseText);
                    cacheJs.checkIfLoaded();
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
                        cacheJs.checkIfLoaded();
                    }
                    for (var i in resource.attributes) {
                        if (resource.attributes[i] !== undefined) {
                            resourceTag.setAttribute(resource.attributes[i].name, resource.attributes[i].value);
                        }
                    }
                    document.head.appendChild(resourceTag);
                } else {
                    console.warn('Unable to load Resource : ' + name + '(response code ' + x.status + ')', resource.uri);
                }
            }
        }
        x.open('GET', resource.uri, true);
        x.send();
    },
    injectAllFiles: function() {
        for (var i in cacheJs.config.files) {
            cacheJs.injectFile(i, cacheJs.config.files[i]);
        }
        cacheJs.initializeDone();
    }
}
