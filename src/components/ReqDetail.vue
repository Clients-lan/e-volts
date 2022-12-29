<template>
    <div>
        <div class="main-panel">
          <div class="page-header">
            <a href="/requests/">Retour aux demandes</a>
        </div>
            <div class="request-detail mt-10">
                <div class="top-header" v-if="loading" >
                    <a-skeleton active :paragraph="{ rows: 2 }" :loading="loading" />
                </div>
                <div v-else class="grid grid-2 top-header">
                    <div>
                        <h3>{{ request.brand }} {{ request.name }} ({{ request.plates }})</h3>
                        <p>{{ request.location }}</p>
                    </div>
                    <div class="align-r">
                        <p>Établi</p>
                        <p>{{ request.date }}</p>
                    </div>
                </div>
                <div class="middle-header">
                  <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" :loading="loading" />
                  <div v-else>
                    <a-steps :current="prog.curr" size="small" class="ui-step">
                     <a-step title="Soumis" :status="prog.a" />
                     <a-step title="En cours" :status="prog.b" />
                     <a-step title="Complété" :status="prog.c" />
                  </a-steps>
                  <p class="mt-20">{{ request.desc }}</p>

                    <div  class="grid grid-3 mt-10">
                        <div class="ui-form">
                            <label class="ui-lable">Propriétaire</label>
                            <p>{{ owner.fname }} {{ owner.lname }}</p>
                        </div>
                        <div class="ui-form">
                            <label class="ui-label">Urgency</label>
                             <a-select class="ui-select" placeholder="Select" style="width: 100%" v-model:value="request.urgency" :bordered="false" required>
                              <a-select-option v-for="item in sAttrs.urgency" :key="item" :value="item">
                               <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                              </a-select-option>
                            </a-select>
                        </div>
                        <div class="ui-form">
                         <label class="ui-label">Date de ramassage</label>
                         <a-date-picker style="width: 100%" v-model:value="dueDate" format="YYYY/MM/DD" />
                      </div>
                      <div class="ui-form">
                        <label class="ui-label">Statut de paiement</label>
                           <a-select class="ui-select" placeholder="Select" @select="watching(request.pay, 'pay')" style="width: 100%" v-model:value="request.pay" :bordered="false" required>
                            <a-select-option v-for="item in sAttrs.pay" :key="item" :value="item">
                           <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                           </a-select-option>
                         </a-select>
                        </div>
                        <div class="ui-form">
                        <label class="ui-label">État du service</label>
                            <a-select :disabled="admin != 'admin'" class="ui-select" @select="watching(request.status, 'service')" placeholder="Select" style="width: 100%" v-model:value="request.status" :bordered="false" required>
                              <a-select-option v-for="item in sAttrs.status" :key="item" :value="item">
                            <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                            </a-select-option>
                         </a-select>
                        </div>
                        <div class="ui-form">
                        <label class="ui-label">Lieu de dépôt / prise en charge</label>
                         <a-select :disabled="admin != 'admin'" placeholder="Select" style="width: 100%" v-model:value="request.location" required>
                          <a-select-option v-for="(item, index) in locations" :key="index" :value="item.location">{{ truncate(item.location, 28) }}</a-select-option>
                         </a-select>
                       </div>
                    </div>
                    </div>
                </div>
                <div class="bottom-header">
                  <a-popconfirm title="Êtes-vous sûr de supprimer cette demande?" ok-text="Oui" cancel-text="Non" @confirm="delPermanent">
                    <a-button type="primary" danger>Supprimer la demande</a-button>
                  </a-popconfirm>
                    <a-button type="dashed" @click="saveChanges" class="ml-10">Sauvegarder les modifications</a-button>
                </div>
            </div>

            <div class="discussion">
                <a-tabs v-model:activeKey="activeKey">
                <a-tab-pane key="1">
                    <template #tab>
                        <span> <MessageOutlined /> Discussion </span>
                    </template>
                    <div class="chat-tab">
                     <a-skeleton avatar active :paragraph="{ rows: 4 }" :loading="loading" />

                    <div class="chat-tab__main disqus-main">
                      <div v-for="(item, index) in rtchat" :key="index" class="bubble" :class="[item.family == 'customer' ? 'chat-me' : 'chat-them']">
                        <div class="flex user-tag">
                         <div class="avatar">
                            <span>{{ item.family == 'admin' ? 'E' : owner.fname.charAt(0).toUpperCase() }}</span>
                         </div>
                         <div>
                          <span>{{ item.family == 'admin'  ? 'E-volts Automobiles' : `${owner.fname} ${owner.lname}` }}</span>
                           <span class="chat-date">@{{ item.date }}</span>
                         </div>
                        </div>
                        <div class="chat-body">
                             <p>{{ item.msg }}</p>
                             <File v-if="item.files && item.files.length > 0" :files="item.files" />
                        </div>
                      </div>
                    </div>
                    <div class="chat-tab__inputs">
                     <form @submit.prevent="postChat">
                        <a-textarea v-model:value="chat.msg" placeholder="Entrez un message ou mettez à jour" required></a-textarea>
                         <p class="mt-10" v-if="admin == 'admin'"><a-switch size="small" @change="watching(checked, 'post')" v-model:checked="checked"></a-switch>  <span class="inline">Notify {{ owner.fname }} about your new message</span></p>
                        <hr class="mt-10">
                        <div class="grid grid-2">
                            <a-upload :multiple="true" @change="handleChange">
                                <a-button type="link">Ajouter des pièces jointes</a-button>
                            </a-upload>
                            <div>
                                <a-button htmlType="submit" class="item-fr" size="large" :loading="wait" type="primary">Envoyer</a-button>
                            </div>
                        </div>
                      </form>
                    </div>
                </div>
                </a-tab-pane>
                <a-tab-pane key="2">
                    <template #tab>
                        <span> <FolderOutlined /> Des dossiers </span>
                    </template>
                     <div class="disqus-main discussion-files">
                        <File :files="fileList" />
                    </div>
                </a-tab-pane>
               </a-tabs>
            </div>
        </div>
    </div>
</template>


<script>
import  { Tag, Button, Select, SelectOption, DatePicker, Input, Textarea, Upload, message, Tabs, TabPane, Switch, Skeleton, Popconfirm, Steps, Step } from 'ant-design-vue';
import { saveAttachment, db, auth, tagMaker, sAttrs, manageCookies, chat, getDocuments, mailer, truncate, delDocument } from '../utils'
import { MessageOutlined, FolderOutlined, DownloadOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons-vue'

import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { ref, set, onValue, update } from "firebase/database";
import { generate } from 'short-uuid'
import dayjs from 'dayjs'

import File from '../components/File.vue'
import emit from '../emit'


export default {
    props: ['par'],
    components:{
        'a-button': Button, 'a-input': Input, 'a-select-option': SelectOption,
        'a-select': Select, 'a-textarea': Textarea, 'a-tabs': Tabs, 'a-popconfirm': Popconfirm,
        'a-date-picker': DatePicker, 'a-tag': Tag, 'a-tab-pane': TabPane, 'a-steps': Steps,
        'a-switch': Switch, 'a-upload': Upload, 'a-skeleton': Skeleton, 'a-step': Step,
        MessageOutlined, FolderOutlined, DownloadOutlined, DeleteOutlined,
        PaperClipOutlined, File
    },
    data: () => ({
        request: {files: []}, sAttrs, alerts: {},
        form: {}, activeKey: '1', loading: true, prog: {},
        currentUser: {}, checked: false, chat: {files: []},
        admin: null, rtchat: [], owner: {fname: ''}, watingUploads: [],
        fileList: [], dueDate: null, locations: [], wait: false
    }),
    methods:{
       async ready(family, id){
            let d = await getDocuments(id, family)
            family == 'requests' ? this.request = d[0] : this.owner = d[0]
            if(family == 'requests') {
              this.mountChat()
              this.progress()
            }
        },
        handleChange(e){
            this.watingUploads = []
            Promise.all([...e.fileList].map(el => this.watingUploads.push(el.originFileObj)))
        },
        postChat() {
            this.wait = true
            if(this.watingUploads.length > 0) return this.handleUpload()
            let postId = this.chat._id || generate()

            set(ref(chat, 'posts/' + this.request._id + '/msg/' + postId), {
                family: this.chat.family || this.admin,
                msg: this.chat.msg,
                user: this.chat.user || this.currentUser.uid,
                date: this.chat.date || new Date().toLocaleString(),
                files: this.chat.files,
                _id: postId
            });
            this.chat = {files: []}
            this.wait = false
        },
       async mountChat(){
          this.ready('customers', this.request.client_id)
          this.locations = await getDocuments(null, 'locations', true)
          this.alerts = await getDocuments(null, 'alerts', true)
          this.loading = false

          const starCountRef = ref(chat, 'posts/' + this.request._id);
            onValue(starCountRef, (snapshot) => {
            const data = snapshot.val();

            this.fileList = this.request['files'].map(el => Object.assign(el, {origin: true}))
            this.dueDate = dayjs(this.request.due)
            emit.$emit('batch-one', this.fileList)

            if(!data || !data.msg) return
            let foo = []
                            
            for(const el in data.msg){
              foo.push(data.msg[el])
              if(data.msg[el].files)
              this.fileList.push(...data.msg[el].files)
            }
            this.rtchat = foo.sort((a, b) => a.date.localeCompare(b.date))
         })
        },
        handleUpload (){
            Promise.all(this.watingUploads.map(el => saveAttachment(el)))
            .then(firebaseAttrs => {
                firebaseAttrs.forEach(el => this.chat['files'].push(el))
                this.watingUploads = []
                this.postChat()
            })
        },
        async saveChanges(){
            this.request['due'] = dayjs(this.dueDate).format()
            await setDoc(doc(db, "requests", this.request._id),  this.request);
            message.success('Modifications mises à jour avec succès !')
        },
        watching(val, fam){
          if(fam == 'post'){
            let msg  = `Bonjour ${this.owner.fname}, vous avez un nouveau message de E-volt Automobiles. Veuillez vous connecter avec cette URL`
            mailer(this.owner.email, 'Post update', msg)
            return setTimeout(() => this.checked = false, 1000);
          }
          let ald = [sAttrs.status[1], sAttrs.pay[3], sAttrs.status[4]], al = this.alerts[0]
          if(ald.includes(val)){
            let msgTag = val == ald[0] ? al['alert_four'] : val == ald[1] ? al['alert_three'] : al['alert_two'] 
            msgTag = msgTag.replaceAll('{username}', `${this.owner.fname} ${this.owner.lname}`)

            mailer(this.owner.email, `${fam} mises à jour`, msgTag)
            this.saveChanges()
          }
        },
        progress(){
          let req = this.request.status, attr = sAttrs.status;
          let b = {curr: 1, a: 'finish', b: 'process', c: 'wait'}
          this.prog = req == attr[0] ? {curr: 0, a: 'finish', b: 'wait', c: 'wait' } 
          : req == attr[1] ? b: req == attr[3] ? {curr: 2, a: 'process', b : 'process', c: 'finish'} : {...b, ...{b: 'error'}}
        },
        delPermanent(){
          const updates = {};
          updates['/posts/' + this.request._id] = {};

          update(ref(chat), updates);
          setTimeout(() => {
            delDocument('requests', this.request._id)
            if(this.fileList.length > 0) emit.$emit('del-remotely', this.fileList) 
          }, 500);
        },
        //@helpers
        tagMaker, truncate, delDocument
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user) return location.href = '/login'
            this.currentUser = user
            this.admin = manageCookies(user.email, 'get')
            this.ready('requests', this.par)
        })

        emit.$on('del-file', (target) => {
          if(target.origin){
            const index = this.fileList.findIndex(file => file.name === target.name);
            this.fileList.splice(index, 1)
            this.request.files = this.fileList.filter(a => a.origin)
            return this.saveChanges()
          }
          const indexParent = this.rtchat.findIndex(chat => chat.files && chat.files.includes(target));
          const indexChild = this.rtchat[indexParent].files.findIndex(file => file.name === target.name)
          this.rtchat[indexParent].files.splice(indexChild, 1)
          this.chat = this.rtchat[indexParent]
          this.postChat()
        })
    },
}
</script>




  
<style lang="scss">
@import '../assets/app.scss';

.ui-select{
    margin-left: -10px;
}

.request-detail, .discussion{
  background-color: #fff;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px 0 rgb(0 0 0 / 6%);
  border-radius: 10px;

  .grid{
    grid-gap: 20px;
    .ui-form{
        margin: 0px;
    }
  }
}

.discussion{
  margin-top: 30px;
  padding: 0 20px 20px 20px;
  .inline{
      display: inline-block;
      transform: translateY(2px);
    }
}

.middle-header{
  border-top: $border;
  border-bottom: $border;
}

.ui-step{
   background: #FBFCFC;
   padding: 20px 10px;
}

.top-header, .middle-header, .bottom-header{
    padding: 20px;
}
.top-header{
    p, h3{
        margin: 0px;
    }
}
.heads{
  display: block;
  margin-top: 20px;
}

.disqus-main{
  min-height: 100px;
}



.bubble span{
  font-size: .9rem;
  font-weight: 400;
}
.bubble .chat-date{
  color: #777;
  font-weight: 300;
  display: inline-block;
  margin-left: 10px;
  font-size: .8rem;
}


.bubble{
  margin-bottom: 20px;
  p{
    font-size: .9rem;
    color: #333;
    margin-top: 0px;
 }
}

.chat-body{
  margin-left: 35px;
  p{
    margin: 0px;
  }
}

.avatar{
  height: 26px;
  width: 26px;
  background-color: #f8df72;
  color: #1e1f21;
  text-align: center;
  border-radius: 50px;
  text-transform: uppercase;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 7%);
  margin-right: 5px;
  position: relative;
}
.avatar span{
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  font-size: .8rem ;
}

.chat-me .avatar{
  background-color: #566573;
  color: #fff;
}


@media (max-width:900px) {
  .middle-header .grid, .top-header{
    grid-template-columns: 100% !important;
    grid-gap: 15px !important;
  }
}







</style>