import React from 'react';
import ReactDOM from 'react-dom';
import dva, { connect } from 'dva';
import { Router, Route } from 'dva/router';
import { createLogger } from 'redux-logger';
import { createBrowserHistory } from 'history';

import keymaster from 'keymaster';

// let app = dva();
// applyMiddleware(createLogger);
const app = dva({
  // onAction: createLogger(),
  history: createBrowserHistory()
})
// combineReducer
/**
 * state = {
 *  counter1: { number: 0 },
 *  counter2: { number: 0 },
 * }
 */
const delay = ms => new Promise(function (resolve) {
  setTimeout(() => {
    resolve();
  }, ms)
})

// 定义模型
app.model({
  namespace: 'counter1',
  state: { number: 0 },
  reducers: {
    // 属性名就是action-type,值就是一个函数，用来计算新状态
    // store.dispatch({type: 'counter1/add'});
    add(state) {
      return { number: state.number + 1 }
    },
    minus(state) {
      return { number: state.number - 1 }
    },
    log(state) {
      console.log('reducers log');
      return { number: 100 };
    }
  },
  // 如果想实现异步操作，需要用effects
  effects: {
    // put是派发动作，call是调用方法
    *asyncAdd(action, { put, call }) {
      yield call(delay, 1000);
      yield put({ type: 'add' });
    },
    *log(action, { select }) {
      let state = yield select(state => state.counter1);
      console.log('effects log', state);
      return state;
    }
  },
  // 订阅
  subscriptions: {
    changeTitle({ history }) {
      history.listen((location) => {
        document.title = location.pathname;
      })
    },
    keyboard({ dispatch }) {
      // space 检测键盘输入
      keymaster('space', () => {
        dispatch({ type: 'add' });
      })
    }
  }
})


function Counter(props) {
  return (
    <div>
      <p>{props.number}</p>
      {/* dispatch 会同时派发给 reducers 和 effects， 在俩者之内找同名*/}
      <button onClick={() => props.dispatch({ type: 'counter1/add' })}>+</button>
      <button onClick={() => props.dispatch({ type: 'counter1/asyncAdd' })}>asyncAdd</button>
      <button onClick={() => props.dispatch({ type: 'counter1/log' })}>log</button>
      <button onClick={() => props.dispatch({ type: 'counter1/minus' })}>-</button>
    </div>
  )
}

let ConnectedCounter = connect(state => state.counter1)(Counter);

// app.router(({ history }) =>
//   <Router history={history}>
//     <>
//       <Route path='/counter1' component={ConnectedCounter1}></Route>
//     </>
//   </Router>
// );
app.router(() => <ConnectedCounter />);

app.start('#root');





/**
 * dva是一个非常非常轻量级的封装
 * react react-dom react-router-dom connected-react-router redux redux-saga
 */
