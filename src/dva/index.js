/* eslint-disable array-callback-return */
/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
// import { createHashHistory } from 'history';
import { NAMESPACE_SEP } from './constant';
export { connect };

export default function (opts = {}) {
    // let history = opts.history || createHashHistory();

    let app = {
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
        let reducers = getReducers(app);
        app._store = createStore(reducers);
        ReactDOM.render(
            <Provider store={app._store}>
                {app._router()}
            </Provider>
            , document.querySelector(container))
    };
    return app;
};

// 就是把model里的reducers对象转成一个管理自己状态state的reducer函数，然后它们会进行合并
function getReducers(app) {
    // 此对象将会用来进行合并，会传给combineReducers
    let reducers = {};
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
function prefixNamespace(model) {
    // reducers: {
    //     add(state) {}
    //   },
    let reducers = model.reducers;
    // Object.keys(reducers) ['add', 'minus']
    model.reducers = Object.keys(reducers).reduce((memo, key) => {
        let newKey = `${model.namespace}${NAMESPACE_SEP}${key}`
        memo[newKey] = reducers[key];
        return memo;
    }, {})
    return model;
}