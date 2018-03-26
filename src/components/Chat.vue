<template>
<div class="container height-100" id="app">
  <div class="tile is-ancestor height-100">
    <div class="tile is-vertical is-8 height-100">
      <div class="tile">
        <div class="tile is-parent is-vertical">
          <article class="tile is-child notification is-default" style="flex-grow:10;">
            <p><a v-on:click="goToHome" class="is-6">Return to the rooms </a><span class="title is-pulled-right">{{username}} <span :class="isConnected">●</span></span>
            </p>
            <p class="subtitle is-7">{{messages.length}} messages</p>
            <div class="content" id="scrollable" style="overflow:scroll; max-height:75vh;">
              <div class="box" style="padding:10px" v-for="message in messages" :key="message.id">
                <div class="columns" style="padding-bottom:0px" v-if="message.username">
                  <div class="column" style="padding-bottom:0px">
                    <p class="title is-6">{{ message.username }}</p>
                  </div>
                  <div class="column" style="padding-bottom:0px">
                    <div class="is-pulled-right">{{ message.date }}</div>
                  </div>
                </div>
                <div class="content">{{ message.message }}
                </div>
              </div>
            </div>
          </article>
          <form v-on:submit.prevent="sendMessage">
          <div class="tile is-child field has-addons notification is-default is-outlined" style="flex-grow:0.5;padding: 0;width:  100%;">
              <div class="control" style="width:100%">
                <input v-model="message" class="input" type="text" placeholder="Type a message..." id="m" autofocus>
              </div>
              <div class="control">
                <button type="submit" class="button is-info" v-on:click="sendMessage">Send</button>
              </div>
          </div>
        </form>
        </div>
      </div>
    </div>

    <div class="tile is-parent is-vertical">
      <article class="tile notification is-child" :class="id" style="flex-grow:1">
        <div class="content">
          <p class="title">{{id}} room <a v-on:click="goToHome" style="text-decoration: none" class="is-pulled-right">x</a> </p>
          <p class="subtitle"></p>
          <div class="content">
            <!-- Content -->
          </div>
        </div>
      </article>
      <article class="tile is-child notification" :class="id" style="flex-grow:10">
        <div class="content">
          <p class="title is-5">Participants</p>
          <div class="content">
            <ul v-for="user in uniqueUsers" :key="user.user">
              <li>
                {{user}}
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </div>
</div>
</template>

<script>

/* eslint-disable */

import Vue from 'vue'
import socket from 'vue-socket.io';
Vue.use(socket, 'http://localhost:3000');
export default {
  name: 'Chat',
  props: ['id'],
  data () {
    return {
      users: [],
      username: "",
      message: "",
      messages: [],
      isConnected: true,
    }
  },
  mounted: function() {
    if (typeof(Storage) !== undefined) {
      this.username = localStorage.getItem('username')
      var username = this.username
      if (this.username !== "") {
        this.$socket.emit('channel.join', JSON.stringify({
          username,
          channel: this.id
        }))
        this.users.push({
          username: username
        })
      }
    }
    while (this.username == undefined || this.username === null || this.username.trim() == '') {
      var username = prompt('Your username')
      if (typeof(Storage) !== undefined) {
        localStorage.setItem('username', username)
        this.username = username
        this.$socket.emit('channel.join', JSON.stringify({
          username,
          channel: this.id
        }))
        this.users.push({
          username: username
        })
      }
    }

    this.$options.sockets['channel.join'] = (data) => {
      const message = JSON.parse(data)
      if(message.channel == this.id){
        this.users.push({
          username: message.username
        })
        this.messages.push({
          message: message.username + ' has joined'
        })
        this.scrollChat()
      }
    }
    this.$options.sockets['channel.add_user'] = (user) =>  {
      var userParsed = JSON.parse(user)
      if (userParsed.username !== null && userParsed.username !== "null" && userParsed.channel == this.id) {
        this.users.push(userParsed)
      }
    }
    this.$options.sockets['channel.del_user'] = (user) =>  {
      var userParsed = JSON.parse(user)
      console.log('left', user)
      if (userParsed.channel == this.id) {
        var username = userParsed.username
        this.messages.push({
          message: username + ' has left the channel'
        })
        this.scrollChat()
        this.users = this.users.filter(user => {
          return user.username != username;
        })
      }
    }

    this.$options.sockets['chat.message'] = message => {
      var messageParsed = JSON.parse(message)
      if(messageParsed.channel == this.id){
        this.messages.push(messageParsed)
        this.scrollChat()
      }
    }

    this.$options.sockets['channel.disconnect'] = data => {
      if(data.channel == this.id){
        const message = JSON.parse(data)
        console.log('disco', message.username)
        var userDisconnected = JSON.parse(message.username)
        this.users = this.users.filter(user => {
          return user.username != userDisconnected.username;
        })
        this.messages.push({
          message: userDisconnected.username + ' has left the chat'
        })
        this.scrollChat()
      }
    }
    this.$options.sockets.disconnect = user => {
      this.isConnected = "has-text-danger";
    }
    this.$options.sockets.connect = user => {
      this.isConnected = "has-text-success";
    }
    this.$options.sockets.reconnect = user => {
      this.isConnected = "has-text-success";
    }
  },
  methods: {
    sendMessage: function(event) {
      if (this.message !== undefined && this.message !== null && this.message.trim() !== '') {

        this.$socket.emit('chat.message', JSON.stringify({
          message: this.message,
          channel: this.id
        }))
        this.message = '';
      }
    },
    scrollChat: function() {
      window.scrollTo(0, document.body.scrollHeight)
      var objDiv = document.getElementById("scrollable");
      objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
      setTimeout(function() {
        objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
      }, 200)
    },
    goToHome: function() {
      const username = this.username
      this.$socket.emit('channel.leave', JSON.stringify({
        username,
        channel: this.id
      }))
      this.$router.push('/');
    },
  },
  computed: {
    uniqueUsers() {
      return [...new Set(this.users.map(u => u.username))]
    }
  }
}
</script>
<style>
.blue{
  background: #209cee;
}
.green{
  background:#23d160;
}
.yellow{
  background:#ffdd57;
}
.red{
  background:#ff2b56;
}
</style>
