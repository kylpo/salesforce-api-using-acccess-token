'use strict';

var API_PATH_PREFIX = "/services/data/v29.0/";

/**
 * Given an accessToken, this will perform xhr requests to salesforce
 *
 * @param {function(Object, Object=)} callback
 * @param {string} method
 * @param {Object} connection
 * @param {string} url
 * @param {string} data
 */
function xhrWithAuth(callback, method, connection, url, data) {
    var xhr = new XMLHttpRequest();
    xhr.onload = requestComplete;
    xhr.open(method, connection.instance_url + url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + connection.access_token);
    if (data) {
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send();
    }

    function requestComplete() {
        // did not succeed
        if (this.status < 200 || this.status >= 300) {
            callback(this.status);
        } else {
            // did succeed
            if (this.response.length > 0) {
                callback(null, JSON.parse(this.response));
            } else {
                callback(null);
            }
        }
    }
}

exports.apiCallWithRetry = function apiCallWithRetry(action, args, getRetryArgs, callback) {
    // Note: this includes the retry handler for the second call
    var handleResponse = function (status, data) {
        switch (status) {
            case null:
            case undefined:
                // Success
                callback(null, data);
                break;
            case 401:
                getRetryArgs(function (newArgs) {
                    if (newArgs === null) {
                        return callback(new Error("Failed to get retry args"));
                    }

                    action.apply(undefined, newArgs.concat(handleRetry));
                });
                break;
            default:
                return callback(new Error("getFeed errored with: " + status));
        }
    };

    // Response handler for the second (retried) api call
    var handleRetry = function (err, data) {
        if (err) {
            return callback(new Error("Errored after retry with status code: " + err));
        }

        return callback(null, data);
    };

    action.apply(undefined, args.concat(handleResponse));
};

/* -------------- Chatter --------------------- */

/**
 * Perform xhrWithAuth GET with params to retrieve actions
 *
 * @param {Object} connection
 * @param {string} url
 * @param {function(Object, Object=)} callback
 */
exports.getFeed = function getFeed(connection, url, callback) {
    if (url !== null) {
        xhrWithAuth(callback, "GET", connection, url);
    } else {
        xhrWithAuth(callback, "GET", connection,
            API_PATH_PREFIX.concat("chatter/feeds/news/me/feed-items?sort=LastModifiedDateDesc&pageSize=15"));
    }
};

exports.getMoreComments = function getMoreComments(connection, url, callback) {
    xhrWithAuth(callback, "GET", connection, url);
};

exports.getGroups = function getGroups(connection, name, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/groups?q=" + encodeURIComponent(name)));
};

exports.getUsers = function getUsers(connection, name, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/users?q=" + encodeURIComponent(name)));
};

/**
 * Perform xhrWithAuth GET with params to retrieve mention completions
 *
 * @param {Object} connection
 * @param {string} query - text of a mention's name
 * @param {function(Object, Object=)} callback
 */
exports.getMentionCompletions = function getMentionCompletions(connection, query, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/mentions/completions?q=" + encodeURIComponent(query)));
};

exports.getTopicCompletions = function getTopicCompletions(connection, query, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("connect/topics?q=" + encodeURIComponent(query)));
};

exports.getHashtags = function getHashtags(connection, tag, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/feed-items?q=" + encodeURIComponent(tag)));
};

exports.getBatch = function getBatch(connection, postIds, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/feed-items/batch/" + postIds));
};

exports.getPostLikes = function getPostLikes(connection, id, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/feed-items/" + id + "/likes"));
};

exports.getCommentLikes = function getCommentLikes(connection, id, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("chatter/comments/" + id + "/likes"));
};

exports.likePost = function likePost(connection, id, callback) {
    xhrWithAuth(callback, "POST", connection, API_PATH_PREFIX.concat("chatter/feed-items/" + id + "/likes"));
};

exports.likeComment = function likeComment(connection, id, callback) {
    xhrWithAuth(callback, "POST", connection, API_PATH_PREFIX.concat("chatter/comments/" + id + "/likes"));
};

exports.submitComment = function submitComment(connection, postId, message, callback) {
    xhrWithAuth(callback, "POST", connection, API_PATH_PREFIX.concat("chatter/feed-items/" + postId + "/comments"), message);
};

/**
 * Perform xhrWithAuth POST with params to submit a Post
 *
 * @param {Object} connection
 * @param {Object} message
 * @param {function(Object, Object=)} callback
 */
exports.submitPost = function submitPost(connection, message, callback) {
    xhrWithAuth(callback, "POST", connection, API_PATH_PREFIX.concat("chatter/feeds/news/me/feed-items"), message);
};

exports.submitPostToRecord = function submitPostToRecord(connection, recordId, message, callback) {
    xhrWithAuth(callback, "POST", connection, API_PATH_PREFIX.concat("chatter/feeds/record/" + recordId + "/feed-items"), message);
};

exports.bookmarkItem = function bookmarkItem(connection, id, shouldBookmark, callback) {
    xhrWithAuth(callback, "PATCH", connection, API_PATH_PREFIX.concat("chatter/feed-items/" + id + "?isBookmarkedByCurrentUser=" + shouldBookmark));
};

exports.unlike = function unlike(connection, url, callback) {
    xhrWithAuth(callback, "DELETE", connection, url);
};

/**
 * Perform xhrWithAuth DELETE with params to delete a Post
 *
 * @param {Object} connection
 * @param {String} id
 * @param {function(Object, Object=)} callback
 */
exports.deletePost = function(connection, id, callback) {
    xhrWithAuth(callback, "DELETE", connection, API_PATH_PREFIX.concat("chatter/feed-items/").concat(id));
};


/* ----------------- Core -------------------------*/

/**
 * Perform xhrWithAuth GET with params to retrieve actions
 *
 * @param {Object} connection
 * @param {function(Object, Object=)} callback
 */
exports.getActions = function(connection, callback) {
    xhrWithAuth(callback, "GET", connection, API_PATH_PREFIX.concat("sobjects/Global/quickActions"));
};

/**
 * Perform xhrWithAuth GET with params to retrieve the description of a specific action
 *
 * @param {Object} connection
 * @param {string} url - a specific action's Describe url
 * @param {function(Object, Object=)} callback
 */
exports.getDescribeAction = function(connection, url, callback) {
    xhrWithAuth(callback, "GET", connection, url);
};


/* ----------------- Special Cases --------------- */

//exports.getImage = function getImage(connection, url, callback) {
//    var xhr = new XMLHttpRequest();
//    xhr.open('GET', connection.instance_url + url, true);
//    xhr.setRequestHeader('Authorization', 'Bearer ' + connection.access_token);
//    xhr.responseType = 'blob';
//    xhr.onload = function() {
//        callback(window.webkitURL.createObjectURL(xhr.response), connection.instance_url + url);
//    };
//    xhr.send();
//};