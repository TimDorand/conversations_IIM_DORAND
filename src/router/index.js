import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Rooms from '@/components/Rooms'
import Chat from '@/components/Chat'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: 'hello',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/',
      name: 'Rooms',
      component: Rooms
    },
    {
      path: '/room/:id',
      name: 'Room',
      component: Chat,
      props: true
    }
  ]
})
