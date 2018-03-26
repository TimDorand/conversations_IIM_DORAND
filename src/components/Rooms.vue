<template>
  <div class="container">
  <h1 class="title is-1">Welcome to conversations</h1>
  <p class="subtitle">Choose a room</p>
  <section class="section rooms" >
    <button class="is-outlined button is-success" v-for="room in rooms" :key="room.room" :class="room" style="margin-right:30px;" v-on:click="goToRoom(room)">{{room}}</button>
  </section>
</div>
</template>

<script>
/* eslint-disable */

import Vue from 'vue'
import socket from 'vue-socket.io'
import Router from 'vue-router'
Vue.use(socket, 'http://localhost:3000');

export default {
  name: 'Rooms',
  components: {
  },
  data() {
    return {
      rooms: [],
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
      let username = this.username
      if (this.username !== "") {
        this.$socket.emit('chat.join', JSON.stringify({
          username
        }))
        this.users.push({
          username: username
        })
      }
    }
    while (this.username == undefined || this.username === null || this.username.trim() == '') {
      let username = prompt('Your username')
      if (typeof(Storage) !== undefined) {
        localStorage.setItem('username', username)
        this.username = username
        this.$socket.emit('chat.join', JSON.stringify({
          username
        }))
        this.users.push({
          username: username
        })
      }
    }
    this.$options.sockets['channel.get'] = room =>  {
      room = JSON.parse(room)
        this.rooms.push(room.channel)
      }

    // this.$options.sockets['chat.add_user'] = (user) =>  {
    //   console.log('add user ', user)
    //   let userNew = JSON.parse(user)
    //   if (userNew.username !== null && userNew.username !== "null") {
    //     console.log(userNew.username)
    //     this.users.push(userNew)
    //   }
    // }
  },
  methods:{
    goToRoom(room) {
      this.$socket.emit('channel.join', JSON.stringify({
        channel: room,
        username: this.username
      }))
      this.$router.push('room/'+room);
    }
  }
}
</script>

<style lang="scss">
.rooms{
.blue{
  border-color: #209cee !important;
  color: #209cee !important;
}
.blue:hover{
  background: #209cee !important;
  color:#fff !important;
}
.green{
  border-color:#23d160 !important;
  color:#23d160 !important;
}
.green:hover{
  background:#23d160 !important;
  color:#fff !important;
}
.yellow{
  border-color:#ffdd57 !important;
  color:#ffdd57 !important;
}
.yellow:hover{
  background:#ffdd57 !important;
  color:#fff !important;
}
.red{
  border-color:#ff2b56 !important;
  color:#ff2b56 !important;
}
.red:hover{
  background:#ff2b56 !important;
  color:#fff !important;
}
}
</style>
