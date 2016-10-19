import {firebase} from './adapter.js'
import store from 'src/helpers/authStore'

const GITHUB_TOKEN_KEY = 'UserGithubToken'


function load () {
  let token = _getStoredToken()
  if (token) { _signInWithCredential(token) }
}
function login () {
  _signInWithPopup()
}
function logout () {
  _signOut()
  _removeToken()
  _clearStore()
}


function _signInWithCredential (token) {
  let credential = firebase.auth.GithubAuthProvider.credential(token)
  if (credential) {
    firebase.auth().signInWithCredential(credential)
    .then((result) => {
      store.commit('ADD_USER', result)
      store.commit('ADD_GITHUB_TOKEN', token)
    })
    .catch(_firebaseErrorHandler)
  }else{
    logout()
  }
}
function _signInWithPopup () {
  let provider = new firebase.auth.GithubAuthProvider()
  firebase.auth().signInWithPopup(provider)
  .then((result) => {
    store.commit('ADD_USER', result.user)
    store.commit('ADD_GITHUB_TOKEN', result.credential.accessToken)

    _storeLocalToken(result.credential.accessToken)
  }).catch(_firebaseErrorHandler)
}
function _signOut () {
  firebase.auth().signOut().catch(_firebaseErrorHandler)
}
function _firebaseErrorHandler (error) {
    console.log(error)
    // // Handle Errors here.
    // var errorCode = error.code;
    // var errorMessage = error.message;
    // // The email of the user's account used.
    // var email = error.email;
    // // The firebase.auth.AuthCredential type that was used.
    // var credential = error.credential;
    // // ...
}
function _getStoredToken () {
  return window.sessionStorage.getItem(GITHUB_TOKEN_KEY) || window.localStorage.getItem(GITHUB_TOKEN_KEY)
}
function _storeLocalToken (token) {
  window.localStorage.setItem(GITHUB_TOKEN_KEY, token)
}
function _removeToken () {
  window.localStorage.removeItem(GITHUB_TOKEN_KEY)
}
function _clearStore () {
  store.commit('REMOVE_USER')
  store.commit('REMOVE_GITHUB_TOKEN')
}

export default {
  load,
  login,
  logout
}
