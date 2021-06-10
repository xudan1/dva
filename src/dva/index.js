/* eslint-disable require-yield */
/* eslint-disable array-callback-return */
/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { createHashHistory } from 'history';
import { routerMiddleware, connectRouter, ConnectedRouter } from 'connected-react-router';

// 自定义
import { NAMESPACE_SEP } from './constant';
export { connect };

export default function (opts = {}) {
    let history = opts.history || createHashHistory();

    let app = {
        _history: history,
        _models: [],
        model,
        _router: null,
        router,
        start,
    };

    function model(m) {
        const prefixedModel = prefixNamespace(m);
        app._models.push(prefixedModel); // 把model放在数组里去
    };

    function router(_router) {
        app._router = _router; // 定义路由
    };

    function start(container) {
        // reducers
        let reducers = getReducers(app);
        // effects
        let sagas = getSagas(app);
        // app._store = createStore(reducers);
        let sagaMiddleware = createSagaMiddleware();
        app._store = applyMiddleware(routerMiddleware(history), sagaMiddleware)(createStore)(reducers);
        // subscriptions
        for (const model of app._models) {
            if (model.subscriptions) {
                for (let key in model.subscriptions) {
                    let subscription = model.subscriptions[key];
                    subscription({ history, dispatch: app._store.dispatch });
                }
            }
        }
        sagas.forEach(sagaMiddleware.run); // run就是启动saga执行
        ReactDOM.render(
            <Provider store={app._store}>
                <ConnectedRouter history={history}>
                    {app._router({ app, history })}
                </ConnectedRouter>
            </Provider>
            , document.querySelector(container))
    };
    return app;
};

// 就是把model里的reducers对象转成一个管理自己状态state的reducer函数，然后它们会进行合并
function getReducers(app) {
    // 此对象将会用来进行合并，会传给combineReducers
    let reducers = {
        router: connectRouter(app._history)
    };
    // 循环模型 app._models是一个数组
    for (const model of app._models) {
        reducers[model.namespace] = function (state = model.state || {}, action) {
            // 这个state是这个model的分状态，而非总状态
            let model_reducer = model.reducers || {};
            let reducer = model_reducer[action.type];
            if (reducer) {
                return reducer(state, action);
            }
            return state;
        }
    }
    return combineReducers(reducers);
}
/**
 * store.dispatch({type: counter1/add})
 * {
 *  counter1: function(state, action){},
 *  counter2: function(state, action){},
 * }
 */

// 此方法就是把reducers对象的属性名从add变成counter/add
function prefix(obj, namespace) {
    // reducers: { add(state) {} }
    // Object.keys(reducers) ['add', 'minus']
    return Object.keys(obj).reduce((memo, key) => {
        let newKey = `${namespace}${NAMESPACE_SEP}${key}`;
        memo[newKey] = obj[key];
        return memo;
    }, {});
}

function prefixNamespace(model) {
    if (model.reducers) {
        model.reducers = prefix(model.reducers, model.namespace);
    }
    if (model.effects) {
        model.effects = prefix(model.effects, model.namespace);
    }
    return model;
}

function getSagas(app) {
    let sagas = [];
    for (const model of app._models) {
        // 把effects对象变成一个saga
        sagas.push(function* () {
            // key = asyncAdd
            for (const key in model.effects) {
                const watcher = getWatcher(key, model.effects[key], model);
                // 为什么要调用fork,是因为fork可以单独开一个进程去执行，而不是阻塞当前saga的执行
                const task = yield sagaEffects.fork(watcher);
                yield sagaEffects.fork(function* () {
                    yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`);
                    yield sagaEffects.cancel(task);
                })
            }
        })
    }
    return sagas;
}

function getWatcher(key, effect, model) {
    function put(action) {
        return sagaEffects.put({ ...action, type: prefixType(action.type, model) });
    }

    return function* () {
        // key = asyncAdd
        yield sagaEffects.takeEvery(key, function* (...args) {
            yield effect(...args, { ...sagaEffects, put });
        })
    }
}

function prefixType(type, model) {
    if (type.indexOf('/' === -1)) {
        return `${model.namespace}${NAMESPACE_SEP}${type}`;
    } else {
        if (type.startsWith(model.namespace)) {
            console.error(`[sagaEffects.put] ${type} should not be prefixed with namespace ${model.name}`);
        }
    }
    return type;
}

