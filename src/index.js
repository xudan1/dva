import React from 'react';
import ReactDOM from 'react-dom';
import dva, { connect } from 'dva';
import { Router, Route, Link, routerRedux } from 'dva/router';
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
      return { number: 100 };
    }
  },
  // 如果想实现异步操作，需要用effects
  effects: {
    // put是派发动作，call是调用方法
    // 要监听counter1/asyncAdd的动作，监听到了之后执行这个saga  takeEvery('counter1/asyncAdd', *asyncAdd(action, effects))
    *asyncAdd(action, { put, call }) {
      yield call(delay, 1000);
      yield put({ type: 'add' });
    },
    *log(action, { select }) {
      let state = yield select(state => state.counter1);
      return state;
    }
  },
  // 订阅
  subscriptions: {
    changeTitle({ history, dispatch }) {
      history.listen(({ pathname }) => {
        document.title = pathname;
        dispatch({ type: 'counter1/add' });
      })
    },
    keyboard({ dispatch }) {
      // space 检测键盘输入
      keymaster('space', () => {
        dispatch({ type: 'counter1/add' });
      })
    }
  }
})
app.model({
  namespace: 'counter2',
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
      return { number: 100 };
    }
  },
  // 如果想实现异步操作，需要用effects
  effects: {
    // put是派发动作，call是调用方法
    // 要监听counter1/asyncAdd的动作，监听到了之后执行这个saga  takeEvery('counter1/asyncAdd', *asyncAdd(action, effects))
    *asyncAdd(action, { put, call }) {
      yield call(delay, 1000);
      yield put({ type: 'add' });
    },
    *log(action, { select }) {
      let state = yield select(state => state.counter2);
      return state;
    }
  },
  // 订阅
  subscriptions: {
    changeTitle({ history }) {
      history.listen(({ pathname }) => {
        document.title = pathname;
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

function Counter1(props) {
  return (
    <div>
      <p>{props.number}</p>
      {/* dispatch 会同时派发给 reducers 和 effects， 在俩者之内找同名*/}
      <button onClick={() => props.dispatch({ type: 'counter1/add' })}>+</button>
      <button onClick={() => props.dispatch(routerRedux.push('/counter2'))}>跳转到counter2</button>
      <button onClick={() => props.dispatch({ type: 'counter1/asyncAdd' })}>asyncAdd</button>
      <button onClick={() => props.dispatch({ type: 'counter1/log' })}>log</button>
      <button onClick={() => props.dispatch({ type: 'counter1/minus' })}>-</button>
      <button onClick={() => props.dispatch({ type: 'counter1/@@CANCEL_EFFECTS' })}>取消effect</button>
    </div>
  )
}
function Counter2(props) {
  return (
    <div>
      <p>{props.number}</p>
      {/* dispatch 会同时派发给 reducers 和 effects， 在俩者之内找同名*/}
      <button onClick={() => props.dispatch({ type: 'counter2/add' })}>+</button>
      <button onClick={() => props.dispatch({ type: 'counter2/asyncAdd' })}>asyncAdd</button>
      <button onClick={() => props.dispatch({ type: 'counter2/log' })}>log</button>
      <button onClick={() => props.dispatch({ type: 'counter2/minus' })}>-</button>
    </div>
  )
}

let ConnectedCounter1 = connect(state => state.counter1)(Counter1);
let ConnectedCounter2 = connect(state => state.counter2)(Counter2);

app.router(({ history }) =>
  <Router history={history}>
    <>
      <Link to="/counter1">counter1</Link>
      <Link to="/counter2">counter2</Link>
      <Route path='/counter1' component={ConnectedCounter1}></Route>
      <Route path='/counter2' component={ConnectedCounter2}></Route>
    </>
  </Router>
);
// app.router(() => <ConnectedCounter />);

app.start('#root');





/**
 * dva是一个非常非常轻量级的封装
 * react react-dom react-router-dom connected-react-router redux redux-saga
 */
